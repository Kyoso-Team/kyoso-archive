import { getCaller } from '$trpc/caller';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async (event) => {
  const caller = await getCaller(event);

  let url = String(event.url);
  let r = '/uploads/';
  let i = url.search(new RegExp(r));
  let upload_url = url.slice(i + r.length);

  let upload = await caller.uploads.obtain(upload_url);
  if (!upload) {
    throw error(404, "Couldn't find the file");
  }

  event.setHeaders({
    'Content-Length': upload.size.toString()
  });

  return new Response(upload.stream());
}) satisfies RequestHandler;
