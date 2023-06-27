import { firsBlogPostTimestmap } from '$lib/constants';
import type { Post } from '$types';
import type { PageServerLoad } from './$types';

export const load = (async ({ fetch }) => {
  let resp = await fetch('https://dev.to/api/articles/latest?username=kyoso');
  let posts = (await resp.json()) as Post[];
  posts = posts.map(({ id, title, published_at, cover_image, description }) => {
    return { id, title, published_at, cover_image, description };
  });
  let morePosts = new Date(posts.at(-1)?.published_at || '').getTime() !== firsBlogPostTimestmap;

  return {
    posts,
    morePosts
  };
}) satisfies PageServerLoad;
