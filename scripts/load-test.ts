
import { Worker } from 'bullmq';
import { workflowQueue } from '../lib/queue/workflow.queue';
import { redisConnection } from '../lib/queue/client';

async function runLoadTest(concurrency: number, totalJobs: number) {
    console.log(`🚀 Starting Load Test with ${concurrency} concurrent producers...`);
    console.log(`📦 Total Jobs: ${totalJobs}`);

    const start = Date.now();
    let completed = 0;

    // Simulate pushing jobs to the queue
    const promises = [];
    for (let i = 0; i < totalJobs; i++) {
        const p = workflowQueue.add('load-test-job', {
            workflowId: `load-test-${i}`,
            executionId: `exec-${i}`,
            mock: true
        }).then(() => {
            completed++;
            if (completed % 100 === 0) {
                process.stdout.write(`\r✅ Enqueued: ${completed}/${totalJobs}`);
            }
        });
        promises.push(p);
    }

    await Promise.all(promises);
    const duration = (Date.now() - start) / 1000;
    console.log(`\n\n🎉 Done! Enqueued ${totalJobs} jobs in ${duration.toFixed(2)}s`);
    console.log(`⚡ Throughput: ${(totalJobs / duration).toFixed(2)} jobs/sec`);

    process.exit(0);
}

// Check if running directly
if (require.main === module) {
    const CONCURRENCY = 1000; // Simulated concurrent users
    const TOTAL_JOBS = 10000; // Total jobs to enqueue
    runLoadTest(CONCURRENCY, TOTAL_JOBS);
}
