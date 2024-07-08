import * as v from 'valibot';
import { blogAuthorsSchema, blogPostSchema, blogTagsSchema } from '$lib/schemas';
import { apiError } from '$lib/server/utils';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { BlogAuthors, BlogPost, BlogTags } from '$types';

export const prerender = 'auto';

export const load = (async ({ route, fetch }) => {
  let resp1: Response;
  let resp2: Response;
  let resp3: Response;

  try {
    const resps = await Promise.all([
      fetch('https://cdn.jsdelivr.net/gh/Kyoso-Team/md-content@main/.dist/blog/posts.json', {
        cache: 'no-cache'
      }),
      fetch('https://cdn.jsdelivr.net/gh/Kyoso-Team/md-content@main/.dist/blog/authors.json'),
      fetch('https://cdn.jsdelivr.net/gh/Kyoso-Team/md-content@main/.dist/blog/tags.json')
    ]);

    resp1 = resps[0];
    resp2 = resps[1];
    resp3 = resps[2];
  } catch (err) {
    throw apiError(err, 'Getting the blog data', route);
  }

  let posts: BlogPost[] = [];
  let authors: BlogAuthors = {};
  let tags: BlogTags = {};

  try {
    posts = await resp1.json();
  } catch (err) {
    error(400, "posts.json is malformed or isn't JSON");
  }

  try {
    authors = await resp2.json();
  } catch (err) {
    error(400, "authors.json is malformed or isn't JSON");
  }

  try {
    tags = await resp3.json();
  } catch (err) {
    error(400, "tags.json is malformed or isn't JSON");
  }

  posts = v.parse(v.array(blogPostSchema), posts);
  authors = v.parse(blogAuthorsSchema, authors);
  tags = v.parse(blogTagsSchema, tags);

  return {
    posts,
    authors,
    tags
  };
}) satisfies LayoutServerLoad;
