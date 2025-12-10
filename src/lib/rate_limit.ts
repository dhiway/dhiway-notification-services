import redis from './redis.js';

export async function rateLimit(
  providerKey: string,
  rate: number,
  burst: number
): Promise<boolean> {
  const key = `rl:${providerKey}`;
  const now = Date.now();

  const lua = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local rate = tonumber(ARGV[2])
    local cap = tonumber(ARGV[3])

    local data = redis.call("HMGET", key, "tokens", "ts")
    local tokens = tonumber(data[1]) or cap
    local ts = tonumber(data[2]) or now

    local delta = now - ts
    local add = (delta / 1000) * rate
    tokens = math.min(cap, tokens + add)

    if tokens < 1 then
      redis.call("HMSET", key, "tokens", tokens, "ts", now)
      redis.call("PEXPIRE", key, 60000)
      return 0
    end

    tokens = tokens - 1
    redis.call("HMSET", key, "tokens", tokens, "ts", now)
    redis.call("PEXPIRE", key, 60000)
    return 1
  `;

  const allowed = await redis.eval(lua, 1, key, now, rate, burst);
  return allowed === 1;
}
