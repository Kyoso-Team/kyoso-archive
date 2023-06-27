<script lang="ts">
  import { format } from '$lib/utils';
  import { firsBlogPostTimestmap } from '$lib/constants';
  import type { Post } from '$types';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let lastPage = 1;
  let posts = data.posts;
  let morePosts = data.morePosts;

  async function onLoadMore() {
    lastPage = lastPage + 1;

    let resp = await fetch(`https://dev.to/api/articles/latest?username=kyoso&page=${lastPage}`);
    let fetchedPosts = (await resp.json()) as Post[];
    fetchedPosts = fetchedPosts.map(({ id, title, published_at, cover_image, description }) => {
      return { id, title, published_at, cover_image, description };
    });

    posts.push(... fetchedPosts);
    morePosts = new Date(fetchedPosts.at(-1)?.published_at || '').getTime() !== firsBlogPostTimestmap;
  }
</script>

<div class="center-content">
  <h1>Blog</h1>
  <p class="pt-4">Announcements, guides, updates and more.</p>
  <div class="flex flex-wrap gap-4 mt-8">
    {#each posts as { id, cover_image, published_at, title, description }}
      <a href={`/blog/post/${id}`} class="card w-96 overflow-hidden">
        <header>
          <img src={cover_image} alt={`${title} - Cover`} />
        </header>
        <div class="p-4">
          <span class="block text-sm text-primary-500 tracking-wide">{format.date(new Date(published_at))}</span>
          <h3 class="block pt-1">{title}</h3>
          <p class="pt-2 text-gray-200 text-justify">{description}</p>
        </div>
      </a>
    {/each}
  </div>
  {#if morePosts}
    <button on:click={onLoadMore} class="mt-4 btn variant-filled-primary">
      Load More
    </button>
  {/if}
</div>