import * as v from 'valibot';
import { apiError } from '$lib/server/utils';
import { error } from '@sveltejs/kit';
import { blogTagsSchema } from '$lib/schemas';
import type { EntryGenerator, PageServerLoad } from './$types';
import type { BlogTags } from '$types';

export const entries = (async () => {
  let resp: Response;

  try {
    resp = await fetch('https://cdn.jsdelivr.net/gh/Kyoso-Team/md-content@main/.dist/blog/tags.json');
  } catch (err) {
    throw apiError(err, 'Getting the tags (during entry generation)', { id: null });
  }

  let tags: BlogTags = {};

  try {
    tags = await resp.json();
  } catch (err) {
    error(400, "tags.json is malformed or isn't JSON (during entry generation)");
  }

  tags = v.parse(blogTagsSchema, tags);
  return Object.values(tags).map((tag) => ({ tag: tag.slug }));
}) satisfies EntryGenerator;

export const load = (async ({ parent, params }) => {
  const { posts, tags, authors } = await parent();

  return {
    posts,
    tags,
    authors
  };
}) satisfies PageServerLoad;
