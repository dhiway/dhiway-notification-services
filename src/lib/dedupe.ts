import redis from './redis.js';

export async function dedupe(key: string, ttlSeconds = 60): Promise<boolean> {
  const res = await redis.set(`dedupe:${key}`, '1', 'EX', ttlSeconds, 'NX');
  return res === 'OK';
}
