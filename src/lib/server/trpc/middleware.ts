import { t } from '$trpc';
import { TRPCError } from '@trpc/server';
import { ratelimit } from '$lib/server/ratelimit';

export const rateLimitMiddleware = t.middleware(
  async ({ path, next, ctx: { getClientAddress } }) => {
    const ip = getClientAddress();
    const identifier = `${path}-${ip}`;

    const result = await ratelimit.limit(identifier);

    if (!result.success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later!'
      });
    }

    return next();
  }
);
