import { Worker } from 'bullmq';
import { redisConnection, redisProducerConnection } from './lib/queue/client';
import { executeWorkflow } from './lib/workflow/execute-workflow';
import {
    moveTerminalFailureToDeadLetter,
    WORKFLOW_QUEUE_NAME,
} from './lib/queue/workflow.queue';
import { markWorkflowExecutionTerminalFailure } from './lib/workflow/execution-lifecycle';

function log(event: string, fields: Record<string, unknown> = {}) {
    console.log(JSON.stringify({ service: 'aiscrape-worker', event, at: new Date().toISOString(), ...fields }));
}

function getWorkerConcurrency(): number {
    const parsed = Number(process.env.WORKER_CONCURRENCY ?? 2);
    return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 8 ? parsed : 2;
}

const workerConcurrency = getWorkerConcurrency();
log('worker.started', { queue: WORKFLOW_QUEUE_NAME, concurrency: workerConcurrency });

const worker = new Worker(
    WORKFLOW_QUEUE_NAME,
    async (job) => {
        log('job.started', { jobId: job.id, executionId: job.data.executionId, attempt: job.attemptsMade + 1 });

        // We do NOT use nextRunAt here yet, but it can be passed in job data if needed for scheduling
        await executeWorkflow(job.data.executionId);

        log('job.completed', { jobId: job.id, executionId: job.data.executionId });
    },
    {
        connection: redisConnection,
        concurrency: workerConcurrency
    }
);

worker.on('completed', (job) => {
    log('job.acknowledged', { jobId: job.id, executionId: job.data.executionId });
});

worker.on('failed', async (job, err) => {
    if (!job) return;
    const terminal = job.attemptsMade >= (job.opts.attempts ?? 1);
    console.error(JSON.stringify({
        service: 'aiscrape-worker', event: terminal ? 'job.dead_lettered' : 'job.retrying',
        at: new Date().toISOString(), jobId: job.id, executionId: job.data.executionId,
        attemptsMade: job.attemptsMade, error: err.message,
    }));
    if (terminal) {
        try {
            await markWorkflowExecutionTerminalFailure(job.data.workflowId, job.data.executionId);
        } catch (stateError) {
            console.error(JSON.stringify({
                service: 'aiscrape-worker',
                event: 'job.terminal_state_reconcile_failed',
                executionId: job.data.executionId,
                error: String(stateError),
            }));
        }

        try {
            await moveTerminalFailureToDeadLetter(job.data, err.message, job.attemptsMade);
        } catch (dlqError) {
            console.error(JSON.stringify({ service: 'aiscrape-worker', event: 'job.dead_letter_failed', error: String(dlqError) }));
        }
    }
});

worker.on('error', (error) => {
    console.error(JSON.stringify({
        service: 'aiscrape-worker',
        event: 'worker.error',
        at: new Date().toISOString(),
        error: error.message,
    }));
});

let shuttingDown = false;
async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    log('worker.shutdown_started', { signal });
    try {
        await worker.close();
        await redisProducerConnection.quit();
        await redisConnection.quit();
        log('worker.shutdown_completed', { signal });
        process.exit(0);
    } catch (error) {
        console.error(JSON.stringify({
            service: 'aiscrape-worker',
            event: 'worker.shutdown_failed',
            signal,
            error: String(error),
        }));
        process.exit(1);
    }
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
