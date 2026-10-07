import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_CONNECTION_URL || 'redis://localhost:6379';

// BullMQ workers need unlimited request retries so transient Redis outages do
// not make the worker process abandon in-flight jobs.
export const redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

// Web/API producers should fail in bounded time instead of hanging an HTTP
// request indefinitely while Redis is unavailable.
export const redisProducerConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
});
