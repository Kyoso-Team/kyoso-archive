import { getCaller } from '$trpc/caller';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (async (event) => {
  const caller = await getCaller(event);
  let upload = await caller.uploads.upload();

  if (upload) {
    return new Response(upload.url);
  } else if (upload === false) {
    throw error(403, "You're not allowed to upload the file");
  } else {
    throw error(400, 'Failed to upload the file');
  }
}) satisfies RequestHandler;
