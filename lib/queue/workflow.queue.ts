import { Queue } from 'bullmq';
import type { JobsOptions } from 'bullmq';
import { redisConnection } from './client';

export const WORKFLOW_QUEUE_NAME = 'workflow-execution-queue';
export const WORKFLOW_DEAD_LETTER_QUEUE_NAME = 'workflow-execution-dead-letter-queue';

export const workflowJobOptions: JobsOptions = {
    // The execution id is stable and becomes the BullMQ job id. Re-submitting an
    // execution therefore cannot create a second concurrent browser run.
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 1000,
    },
    removeOnComplete: true,
    // Preserve failed jobs long enough to inspect and replay them from the UI or
    // Redis CLI. The worker mirrors terminal failures to the DLQ as well.
    removeOnFail: 1000,
};

export const workflowQueue = new Queue(WORKFLOW_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: workflowJobOptions,
});

export async function submitWorkflowToQueue(workflowId: string, executionId: string) {
    await workflowQueue.add('execute-workflow', {
        workflowId,
        executionId,
    }, {
        ...workflowJobOptions,
        jobId: executionId,
    });
}

export const workflowDeadLetterQueue = new Queue(WORKFLOW_DEAD_LETTER_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 1000,
    },
});

export async function moveTerminalFailureToDeadLetter(
    data: { workflowId: string; executionId: string },
    failedReason: string,
    attemptsMade: number,
) {
    // Idempotent DLQ insertion protects against duplicate failed events.
    await workflowDeadLetterQueue.add('workflow-execution-failed', {
        ...data,
        failedReason,
        attemptsMade,
        failedAt: new Date().toISOString(),
    }, {
        jobId: data.executionId,
    });
}
