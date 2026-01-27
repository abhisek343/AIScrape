import { Queue } from 'bullmq';
import { redisConnection } from './client';

export const WORKFLOW_QUEUE_NAME = 'workflow-execution-queue';

export const workflowQueue = new Queue(WORKFLOW_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true, // Auto-remove completed jobs to save Redis memory
        removeOnFail: 1000,     // Keep last 1000 failed jobs for debugging
    },
});

export async function submitWorkflowToQueue(workflowId: string, executionId: string) {
    await workflowQueue.add('execute-workflow', {
        workflowId,
        executionId,
    });
}
