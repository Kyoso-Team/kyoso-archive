<script lang="ts">
  import { page } from '$app/stores';
  import type { Tournament } from '$db';

  export let tournament: Pick<
    typeof Tournament.$inferSelect,
    'id' | 'urlSlug' | 'name' | 'bannerMetadata'
  >;
  export let playing = false;

  $: bannerSrc = tournament.bannerMetadata
    ? `${$page.url.origin}/api/assets/tournament_banner?tournament_id=${tournament.id}&file_id=${tournament.bannerMetadata.fileId}&size=thumb&public=${playing ? 'true' : 'false'}`
    : `${$page.url.origin}/defaults/tournament-banner-thumb.jpeg`;
</script>

<a
  href={`/m/${tournament.urlSlug}`}
  class="!hover:filter-none relative block h-20 aspect-[21/9] w-full overflow-hidden rounded-md border border-primary-500 !no-underline bg-center bg-cover bg-no-repeat"
  style={`background-image: url("${bannerSrc}");`}
>
  {#if !tournament.bannerMetadata}
    <span
      class="absolute inset-0 z-[1] flex justify-center items-center font-violet-sans text-xs text-white px-4 text-center"
    >
      {tournament.name}
    </span>
  {/if}
  <div
    class="absolute inset-0 z-[2] flex h-full items-center justify-center bg-white/75 dark:bg-black/75 opacity-0 duration-150 hover:opacity-100"
  >
    <span class="px-4 font-semibold text-black dark:text-white text-center">{tournament.name}</span>
  </div>
</a>
