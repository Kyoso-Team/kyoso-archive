<script lang="ts">
  import { NoSearchResultsIcon } from '$components';

  export let label: string;
  export let resultCount: number;
  export let styles: string | undefined = undefined;
</script>

<div class={styles}>
  <h2 class="pl-1 pb-1">{label}</h2>
  <div class="card mb-2 flex min-w-[18.5rem] max-w-5xl flex-wrap justify-center gap-4 p-4">
    {#if resultCount === 0}
      <div class="flex flex-col items-center">
        <NoSearchResultsIcon w={75} h={75} styles="fill-primary-500" />
        No results found
      </div>
    {:else}
      <slot />
    {/if}
  </div>
  <slot name="footer" />
</div>