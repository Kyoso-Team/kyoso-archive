import { getCaller } from '$trpc/caller';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from "./$types";

export const GET = (async (event) => {
	const caller = await getCaller(event)
  let image_url = event.params.slug

  let img = await caller.images.obtain(image_url)
  if (!img || !img.data) {
    throw error(404, "Couldn't find the image")
  }
  if (image_url !== String(img.id)) {
    throw redirect(302, `./${img.id}`)
  }

  event.setHeaders({
    'Content-Type': img.mime_type,
    'Content-Length': img.size.toString(),
    'Last-Modified': new Date(Number(img.last_modified)).toUTCString()
  });

  return new Response(img.data);
}) satisfies RequestHandler;
