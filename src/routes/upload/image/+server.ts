import { getCaller } from '$trpc/caller';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (async (event) => {
  const caller = await getCaller(event);
  const form = await event.request.formData()
	const img = form.get("file") as File

  let upload = await caller.images.upload(img)
  throw redirect(302, `/images/${upload.id}`);
}) satisfies RequestHandler;
