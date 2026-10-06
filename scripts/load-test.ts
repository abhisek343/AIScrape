import { Queue } from 'bullmq';

import { redisConnection } from '../lib/queue/client';

const BENCHMARK_QUEUE_NAME = 'aiscrape-queue-enqueue-benchmark';

function parsePositiveInteger(value: string | undefined, fallback: number, name: string): number {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`${name} must be a positive integer`);
    }
    return parsed;
}

async function runQueueEnqueueBenchmark(concurrency: number, totalJobs: number) {
    const queue = new Queue(BENCHMARK_QUEUE_NAME, { connection: redisConnection });
    const producerCount = Math.min(concurrency, totalJobs);
    let nextJob = 0;
    let enqueued = 0;

    console.log('AIScrape queue enqueue benchmark');
    console.log('This measures Redis/BullMQ submission throughput only.');
    console.log('It does NOT measure browser execution or end-to-end workflow capacity.');
    console.log(`Producer concurrency: ${producerCount}`);
    console.log(`Jobs to enqueue: ${totalJobs}`);

    const startedAt = performance.now();

    async function producer() {
        while (true) {
            const index = nextJob++;
            if (index >= totalJobs) return;

            await queue.add('enqueue-benchmark', {
                sequence: index,
                createdAt: new Date().toISOString(),
            });

            enqueued++;
            if (enqueued % 100 === 0 || enqueued === totalJobs) {
                process.stdout.write(`\rEnqueued: ${enqueued}/${totalJobs}`);
            }
        }
    }

    try {
        await Promise.all(Array.from({ length: producerCount }, () => producer()));
        const elapsedSeconds = (performance.now() - startedAt) / 1000;
        const throughput = totalJobs / elapsedSeconds;

        process.stdout.write('\n');
        console.log(`Elapsed: ${elapsedSeconds.toFixed(2)}s`);
        console.log(`Queue enqueue throughput: ${throughput.toFixed(2)} jobs/s`);
    } finally {
        // This queue is isolated from the application worker and contains only
        // benchmark jobs, so cleaning it cannot affect workflow executions.
        await queue.drain(true);
        await queue.close();
    }
}

const concurrency = parsePositiveInteger(
    process.env.BENCHMARK_CONCURRENCY ?? process.argv[2],
    25,
    'concurrency',
);
const totalJobs = parsePositiveInteger(
    process.env.BENCHMARK_JOBS ?? process.argv[3],
    1000,
    'totalJobs',
);

runQueueEnqueueBenchmark(concurrency, totalJobs).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
