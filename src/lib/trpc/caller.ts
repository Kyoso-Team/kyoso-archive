import { router, type Router } from '$trpc/router';
import { createContext } from '$trpc/context';
import type { RequestEvent } from '@sveltejs/kit';

export async function getCaller(event: RequestEvent) {
  return router.createCaller(await createContext(event));
}
