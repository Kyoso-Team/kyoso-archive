<script lang="ts">
  import { page } from '$app/stores';
  import { getFileUrl } from '$lib/utils';
  import type { Tournament } from '$db';

  export let tournament: Pick<typeof Tournament.$inferSelect, 'id' | 'name' | 'bannerMetadata'>;
  export let playing = false;

  $: bannerUrl = tournament.bannerMetadata
    ? getFileUrl(
        $page,
        `tournament_banner?tournament_id=${tournament.id}&file_id=${tournament.bannerMetadata.fileId}${
          playing ? '&public=true' : ''
        }`
      )
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
    {#if !tournament.bannerMetadata}
      <span
        class="font-violet-sans relative z-[3] -mt-2 inline-block text-xs tracking-wide text-white"
        >{tournament.name}</span
      >
    {/if}
  </div>
  <div
    class="absolute inset-0 z-[4] flex h-full items-center justify-center bg-[rgba(0,0,0,0.75)] opacity-0 duration-150 hover:opacity-100"
  >
    <span class="px-4 font-semibold text-white text-center">{tournament.name}</span>
  </div>
</a>
