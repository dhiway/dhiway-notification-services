import { Job } from '../types';
import redis from './redis.js';

export const pushRealtime = async (job: Job) =>
  await redis.lpush('queue:realtime', JSON.stringify(job));

export const pushOther = async (job: Job) =>
  await redis.lpush('queue:other', JSON.stringify(job));

export const popRealtime = async () => await redis.brpop('queue:realtime', 0);

export const popOther = async () => await redis.brpop('queue:other', 0);
