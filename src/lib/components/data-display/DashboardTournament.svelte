<!-- <script lang="ts">
  import { page } from '$app/stores';
  import { getFileUrl, format } from '$lib/utils';

  export let tournament: {
    id: number;
    name: string;
    hasBanner: boolean;
  };
  let bannerUrl = tournament.hasBanner
    ? getFileUrl($page, `tournament-banners/${format.digits(tournament.id, 8)}-thumb.jpeg`)
    : `${$page.url.origin}/defaults/tournament-banner-thumb.jpeg`;
</script>

<a
  href={`/tournament/${tournament.id}/manage`}
  class="!hover:filter-none relative block h-[4.5rem] w-full overflow-hidden rounded-md border border-primary-500 !no-underline"
>
  <div class="relative z-[2] flex h-full items-center justify-center">
    <img
      src={bannerUrl}
      alt={`banner-${tournament.id}`}
      class="absolute inset-0 -mt-3 aspect-[21/9] w-full"
    />
    {#if !tournament.hasBanner}
      <span
        class="font-violet-sans relative z-[3] -mt-2 inline-block text-xs tracking-wide text-white"
        >{tournament.name}</span
      >
    {/if}
  </div>
  <div
    class="absolute inset-0 z-[4] flex h-full items-center justify-center bg-[rgba(0,0,0,0.75)] opacity-0 duration-150 hover:opacity-100"
  >
    <span class="px-4 font-semibold text-white">{tournament.name}</span>
  </div>
</a> -->
