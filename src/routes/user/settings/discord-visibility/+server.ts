import { getCaller } from '$trpc/caller';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (async (event) => {
  const caller = await getCaller(event);
  let body = JSON.parse(await event.request.text())
  let success = await caller.settings.changeDiscordVisibility(body.visibleDiscord)

  if (success) {
    return new Response("Successfully changed the Discord tag's visibility!")
  } else {
    throw error(500, "Failed to update the Discord tag's visibility...")
  }
}) satisfies RequestHandler;
