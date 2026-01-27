import { Worker } from 'bullmq';
import { redisConnection } from './lib/queue/client';
import { executeWorkflow } from './lib/workflow/execute-workflow';
import { WORKFLOW_QUEUE_NAME } from './lib/queue/workflow.queue';

console.log('Worker started. Listening for jobs...');

const worker = new Worker(
    WORKFLOW_QUEUE_NAME,
    async (job) => {
        console.log(`Processing job ${job.id} for execution ${job.data.executionId}`);

        // We do NOT use nextRunAt here yet, but it can be passed in job data if needed for scheduling
        await executeWorkflow(job.data.executionId);

        console.log(`Job ${job.id} completed.`);
    },
    {
        connection: redisConnection,
        concurrency: 5, // Process up to 5 workflows in parallel
    }
);

worker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} has failed with ${err.message}`);
});
