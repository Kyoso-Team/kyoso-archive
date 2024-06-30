import * as v from 'valibot';
import { apiError } from '$lib/server/utils';
import { blogSchema } from '$lib/schemas';
import type { LayoutServerLoad } from './$types';

export const prerender = 'auto';

export const load = (async ({ route }) => {
  let resp: Response;

  try {
    resp = await fetch('https://raw.githubusercontent.com/Kyoso-Team/md-content/main/.dist/blog.json');
  } catch (err) {
    throw await apiError(err, 'Getting the blog JSON', route);
  }

  const data = await resp.json();
  const blog = v.parse(blogSchema, data);

  return blog;
}) satisfies LayoutServerLoad;
