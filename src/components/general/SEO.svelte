<script lang="ts">
  import { MetaTags } from 'svelte-meta-tags';
  import type { PageStore } from '$types';

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
  <MetaTags
    {title}
    {description}
    noindex={noIndex}
    canonical={page.url.href}
    openGraph={{
      title,
      description,
      url: page.url.href,
      site_name: 'Kyoso',
      images: image ? [image] : []
    }}
    twitter={{
      title,
      description,
      cardType: image?.twitterCardType,
      site: '@kyoso_tournaments',
      image: image?.url,
      imageAlt: image?.alt
    }}
  />
</svelte:head>
