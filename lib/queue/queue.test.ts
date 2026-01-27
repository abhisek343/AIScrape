import { submitWorkflowToQueue, workflowQueue } from './workflow.queue';
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
        });
    });
});
