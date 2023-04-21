import { getCaller } from '$trpc/caller';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (async (event) => {
  const caller = await getCaller(event);
	let body = JSON.parse(await event.request.text())

	if (!body.action) {
		throw error(400, "No action specified")
	}

	if (body.action === "discord-change") {
		let link = await caller.auth.generateDiscordAuthLink();
		return new Response(link);
	} else if (body.action === "discord-visibility" && body.visibleDiscord !== undefined) {
		let success = await caller.settings.changeDiscordVisibility(body.visibleDiscord)

		if (success) {
			return new Response("Successfully changed the Discord tag's visibility!")
		} else {
			throw error(500, "Failed to update the Discord tag's visibility...")
		}
	}

  throw error(400, "Unrecognized action")
}) satisfies RequestHandler;
