import { Job } from 'src/types';
import redis from './redis';

// Queue Keys

const REALTIME_QUEUE = 'queue:realtime';
const OTHER_QUEUE = 'queue:other';
const RETRY_ZSET = 'queue:retry';
const DLQ_QUEUE = 'queue:dlq';

// Basic Queue Operations

/** Enqueue realtime job (high priority). */
export async function pushRealtime(job: Job) {
  return redis.lpush(REALTIME_QUEUE, JSON.stringify(job));
}

/** Enqueue fallback job. */
export async function pushOther(job: Job) {
  return redis.lpush(OTHER_QUEUE, JSON.stringify(job));
}

/** Pop from REALTIME queue (non-blocking). */
export async function popRealtime() {
  return redis.brpop(REALTIME_QUEUE, 0); // BLOCKS until an item arrives
}

/** Pop from OTHER queue (non-blocking). */
export async function popOther() {
  return redis.brpop(OTHER_QUEUE, 0);
}

// Dead Letter Queue
export async function pushDLQ(job: Job) {
  console.log('DLQ →', job.job_id);
  return redis.lpush(DLQ_QUEUE, JSON.stringify(job));
}

// Retry Scheduling
/**
 * Schedule retry using a ZSET sorted by future timestamp.
 */
export async function scheduleRetry(job: Job, delaySeconds: number) {
  const timestamp = Date.now() + delaySeconds * 1000;

  return redis.zadd(RETRY_ZSET, timestamp.toString(), JSON.stringify(job));
}

/**
 * Pop due retry jobs:
 * - Fetch jobs where timestamp <= NOW
 * - Remove them atomically
 */
export async function popScheduledRetries(): Promise<Job[]> {
  const now = Date.now();

  // Step 1: get due jobs
  const results = await redis.zrangebyscore(RETRY_ZSET, 0, now);

  if (results.length === 0) return [];

  // Step 2: remove fetched jobs
  await redis.zremrangebyscore(RETRY_ZSET, 0, now);

  // Step 3: Deserialize to Job[]
  return results.map((raw) => JSON.parse(raw));
}

export async function getQueueMetrics() {
  const execResult = await redis
    .multi()
    .llen(REALTIME_QUEUE)
    .llen(OTHER_QUEUE)
    .zcard(RETRY_ZSET)
    .zrange(RETRY_ZSET, 0, 0, 'WITHSCORES') // oldest retry entry
    .llen(DLQ_QUEUE)
    .exec();

  if (!execResult) {
    return {
      realtime: 0,
      other: 0,
      retry_count: 0,
      retry_oldest: null,
      retry_eta_seconds: null,
      dlq: 0,
    };
  }

  const [
    [, realtime],
    [, other],
    [, retry_count],
    [, oldestRetryRaw],
    [, dlq],
  ] = execResult;

  // Handle empty retry zset
  let retry_oldest: number | null = null;
  let retry_eta_seconds: number | null = null;

  if (Array.isArray(oldestRetryRaw) && oldestRetryRaw.length === 2) {
    const score = Number(oldestRetryRaw[1]); // timestamp in seconds
    retry_oldest = score;

    const now = Math.floor(Date.now() / 1000);
    retry_eta_seconds = Math.max(0, score - now);
  }

  return {
    realtime,
    other,
    retry_count,
    retry_oldest,
    retry_eta_seconds,
    dlq,
  };
}
