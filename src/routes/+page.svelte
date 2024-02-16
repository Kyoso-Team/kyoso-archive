<script lang="ts">
  import { page } from '$app/stores';
  import { SEO } from '$components/general';
</script>

<SEO
  page={$page}
  title="Kyoso"
  description="osu! tournament management beyond spreadsheets"
  image={{
    url: `${$page.url.origin}/seo/home.png`,
    alt: 'kyoso-banner',
    height: 630,
    width: 1200,
    twitterCardType: 'summary_large_image'
  }}
/>
<div class="relative h-[32rem]">
  <div class="relative z-[2] flex h-full w-screen items-center overflow-hidden opacity-20">
    <video src="./landing-bg-video.mp4" class="absolute w-full pb-2" autoplay loop>
      <track kind="captions" />
    </video>
  </div>
  <div
    class="absolute left-0 top-0 z-[3] h-full w-screen bg-gradient-to-t from-surface-50 dark:from-surface-900 from-10% via-transparent dark:via-transparent via-50% to-surface-50 dark:to-surface-900 to-90%"
  />
  <div
    class="absolute left-0 top-0 z-[4] flex h-full w-screen flex-col items-center justify-center"
  >
    <h1 class="max-w-4xl text-center !text-6xl font-bold tracking-tight">
      osu! tournament management beyond spreadsheets
    </h1>
    <p class="max-w-xl pt-6 text-center text-lg text-zinc-900 dark:text-zinc-300">
      A web application for hosting osu! tournaments in a professional manner, regardless of scale
      or complexity.
    </p>
    <!-- <a href="/dashboard" class="btn variant-filled-primary font-medium mt-6">Host Your Tournament Now</a> -->
  </div>
</div>
