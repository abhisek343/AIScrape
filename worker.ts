import { Worker } from 'bullmq';
import { redisConnection } from './lib/queue/client';
import { executeWorkflow } from './lib/workflow/execute-workflow';
import {
    moveTerminalFailureToDeadLetter,
    WORKFLOW_QUEUE_NAME,
} from './lib/queue/workflow.queue';

function log(event: string, fields: Record<string, unknown> = {}) {
    console.log(JSON.stringify({ service: 'aiscrape-worker', event, at: new Date().toISOString(), ...fields }));
}

log('worker.started', { queue: WORKFLOW_QUEUE_NAME });

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
        concurrency: 5, // Process up to 5 workflows in parallel
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
            await moveTerminalFailureToDeadLetter(job.data, err.message, job.attemptsMade);
        } catch (dlqError) {
            console.error(JSON.stringify({ service: 'aiscrape-worker', event: 'job.dead_letter_failed', error: String(dlqError) }));
        }
    }
});
