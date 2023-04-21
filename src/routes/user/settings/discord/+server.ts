import { getCaller } from '$trpc/caller';
import type { RequestHandler } from './$types';

export const POST = (async (event) => {
  const caller = await getCaller(event);
  let link = await caller.auth.generateDiscordAuthLink();
	return new Response(link);
}) satisfies RequestHandler;
