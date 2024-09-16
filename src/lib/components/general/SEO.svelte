<script lang="ts">
  import type { PageStore } from '$types/general';

  export let title: string;
  export let page: PageStore;
  export let description: string | undefined = undefined;
  export let noIndex: boolean = false;
  export let image:
    | {
        url: string;
        alt: string;
        width: number;
        height: number;
        twitterCardType: 'summary' | 'summary_large_image';
      }
    | undefined = undefined;
</script>

<svelte:head>
  <link rel="canonical" href={page.url.href} />
  <meta name="description" content={description} />
  <meta property="og:url" content={page.url.href} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:site_name" content="Kyoso" />
  {#if image}
    <meta property="og:image" content={image.url} />
    <meta property="og:image:alt" content={image.alt} />
    <meta property="og:image:width" content={image.width.toString()} />
    <meta property="og:image:height" content={image.height.toString()} />
    <meta name="twitter:card" content={image.twitterCardType} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image.url} />
    <meta name="twitter:image:alt" content={image.alt} />
    <meta name="twitter:site" content="@kyoso_tournaments" />
  {/if}
  {#if noIndex}
    <meta name="robots" content="noindex" />
  {/if}
  <title>{title}</title>
</svelte:head>
