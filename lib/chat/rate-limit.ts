import { redisProducerConnection } from '@/lib/queue/client';

const DEFAULT_REQUESTS_PER_MINUTE = 20;

export async function reserveChatRequest(
  userId: string,
  limit = DEFAULT_REQUESTS_PER_MINUTE,
): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 60_000);
  const key = `aiscrape:chat-rate:${userId}:${bucket}`;

  const count = await redisProducerConnection.incr(key);
  if (count === 1) {
    await redisProducerConnection.expire(key, 120);
  }

  return count <= limit;
}
