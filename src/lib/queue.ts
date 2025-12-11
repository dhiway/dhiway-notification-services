import { Job } from '../types';
import redis from './redis.js';

export const pushRealtime = async (job: Job) =>
  await redis.lpush('queue:realtime', JSON.stringify(job));

export const pushOther = async (job: Job) =>
  await redis.lpush('queue:other', JSON.stringify(job));

export const popRealtime = async () => await redis.brpop('queue:realtime', 0);

export const popOther = async () => await redis.brpop('queue:other', 0);

// scheduled retry queue
export async function pushDLQ(job: Job) {
  await redis.lpush('queue:dead', JSON.stringify(job));
}

export async function scheduleRetry(
  job: Job,
  delaySeconds: number
): Promise<void> {
  const nowSec = Math.floor(Date.now() / 1000);
  const score = nowSec + Math.floor(delaySeconds);

  job.next_attempt_at = score;

  await redis.zadd('queue:retry', score, JSON.stringify(job));
}

export async function popScheduledRetries(): Promise<Job[]> {
  const now = Math.floor(Date.now() / 1000);

  const items = await redis.zrangebyscore('queue:retry', 0, now);
  if (!items.length) return [];

  await redis.zremrangebyscore('queue:retry', 0, now);

  return items.map((i) => JSON.parse(i));
}
