import { moveTerminalFailureToDeadLetter, submitWorkflowToQueue, workflowDeadLetterQueue, workflowJobOptions, workflowQueue } from './workflow.queue';
import { Queue } from 'bullmq';

// Mock the Redis client
jest.mock('./client', () => ({
    redisConnection: {},
}));

// Mock BullMQ
jest.mock('bullmq', () => {
    return {
        Queue: jest.fn().mockImplementation(() => {
            return {
                add: jest.fn(),
            };
        }),
    };
});

describe('Workflow Queue', () => {
    it('should submit a workflow execution to the queue', async () => {
        const workflowId = 'wf-123';
        const executionId = 'exec-456';

        await submitWorkflowToQueue(workflowId, executionId);

        // workflowQueue IS the mocked object returned by the constructor
        // We cast it to any because Typescript thinks it's the real Queue class
        const queueInstance = workflowQueue as any;

        expect(queueInstance.add).toBeDefined();
        expect(queueInstance.add).toHaveBeenCalledTimes(1);
        expect(queueInstance.add).toHaveBeenCalledWith('execute-workflow', {
            workflowId,
            executionId,
        }, expect.objectContaining({
            jobId: executionId,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
        }));
    });

    it('uses stable execution ids, retry policy, and a dead-letter queue', async () => {
        const deadLetterQueue = workflowDeadLetterQueue as any;
        expect(workflowJobOptions.attempts).toBe(3);
        expect(workflowJobOptions.backoff).toEqual({ type: 'exponential', delay: 1000 });

        await moveTerminalFailureToDeadLetter({ workflowId: 'wf-123', executionId: 'exec-456' }, 'timeout', 3);

        expect(deadLetterQueue.add).toHaveBeenCalledWith(
            'workflow-execution-failed',
            expect.objectContaining({ workflowId: 'wf-123', executionId: 'exec-456', failedReason: 'timeout', attemptsMade: 3 }),
            { jobId: 'exec-456' },
        );
    });
});
