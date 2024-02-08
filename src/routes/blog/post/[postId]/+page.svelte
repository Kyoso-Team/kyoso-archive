<!-- <script lang="ts">
  import { page } from '$app/stores';
  import { SEO } from '$components';
  import { format } from '$lib/utils';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
</script>

<SEO
  page={$page}
  title={data.title}
  description={data.description}
  image={{
    url: data.cover_image,
    alt: 'blog-post-cover',
    height: 600,
    width: 1428,
    twitterCardType: 'summary_large_image'
  }}
/>
<div class="center-content">
  <div class="document text-left">
    <h1>{data.title}</h1>
    <span class="text-primary-500">Published on:</span>
    <span> {format.date(new Date(data.published_at))}</span>
    <div class="absolute left-0 mt-8 w-screen overflow-hidden border-b border-surface-700" />
    <div class="mt-16">
      {@html data.body_html}
    </div>
  </div>
</div> -->
