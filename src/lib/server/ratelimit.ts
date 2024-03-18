import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import env from '$lib/server/env';

export const ratelimit = new Ratelimit({
  redis: new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN
  }),
  limiter: Ratelimit.slidingWindow(1, '10 s')
});