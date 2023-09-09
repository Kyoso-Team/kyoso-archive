<script lang="ts">
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
  class="block w-full h-[4.5rem] !no-underline rounded-md relative overflow-hidden border border-primary-500 !hover:filter-none"
>
  <div class="relative z-[2] flex justify-center items-center h-full">
    <img
      src={bannerUrl}
      alt={`banner-${tournament.id}`}
      class="absolute inset-0 w-full aspect-[21/9] -mt-3"
    />
    {#if !tournament.hasBanner}
      <span class="relative font-violet-sans z-[3] text-white text-xs inline-block -mt-2 tracking-wide">{tournament.name}</span>
    {/if}
  </div>
  <div class="absolute inset-0 z-[4] flex justify-center items-center h-full opacity-0 hover:opacity-100 duration-150 bg-[rgba(0,0,0,0.75)]">
    <span class="text-white font-semibold px-4">{tournament.name}</span>
  </div>
</a>