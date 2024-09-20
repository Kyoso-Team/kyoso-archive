import { catcher, error } from '$lib/server/error';
import { ratelimit, trpc } from '$lib/server/services';

export const rateLimitMiddleware = trpc.middleware(
  async ({ path, next, ctx: { getClientAddress } }) => {
    const ip = getClientAddress();
    const identifier = `${path}-${ip}`;

    const result = await ratelimit.limit(identifier).catch(catcher('trpc', 'Rate limiting'));

    if (!result.success) {
      error('trpc', 'too_many_requests', 'Too many requests, please try again later');
    }

    return next();
  }
);
