import { getCaller } from '$trpc/caller';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (async (event) => {
  const caller = await getCaller(event)
  let upload = await caller.images.upload()
  throw redirect(302, `/images/${upload.id}`)
}) satisfies RequestHandler;
