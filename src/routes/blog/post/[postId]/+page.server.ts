import { z } from 'zod';
import type { ExtendedPost } from '$types';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, fetch }) => {
  let postId = z.number().int().parse(Number(params.postId));

  let resp = await fetch(`https://dev.to/api/articles/${postId}`, {
    headers: {
      accept: 'application/vnd.forem.api-v1+json'
    }
  });
  let { body_html, published_at, title } = (await resp.json()) as ExtendedPost;

  return {
    body_html,
    published_at,
    title
  };
}) satisfies PageServerLoad;
