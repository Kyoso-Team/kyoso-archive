<script lang="ts">
  import type { MaybePromise } from '@sveltejs/kit';

  export let page = 1;
  export let elementsPerPage = 30;
  export let count: number;
  export let onPageChange: (page: number) => MaybePromise<void>;
  let arrowStyles = 'btn btn-sm variant-filled-primary';
  let first = 0;
  let last = 0;

  function arrowBtnClick(newPage: number) {
    if (newPage >= first && newPage <= last) {
      onPageChange(newPage);
    }
  }

  $: {
    let totalPages = Math.ceil(count / elementsPerPage);

    if (totalPages <= 7) {
      first = 1;
      last = totalPages;
    } else if (page <= 4) {
      first = 1;
      last = 7;
    } else if (page >= totalPages - 4) {
      first = totalPages - 7;
      last = totalPages;
    } else {
      first = page - 3;
      last = page + 3;
    }
  }
</script>

<div class="flex justify-center gap-2">
  <button class={arrowStyles} on:click={() => arrowBtnClick(page - 1)}>{'<'}</button>
  {#each new Array(last - first + 1) as _, i}
    {#if first + i === page}
      <button class="btn btn-sm variant-ghost-primary">{first + i}</button>
    {:else}
      <button class="btn btn-sm variant-ghost-surface" on:click={() => onPageChange(first + i)}
        >{first + i}</button
      >
    {/if}
  {/each}
  <button class={arrowStyles} on:click={() => arrowBtnClick(page + 1)}>{'>'}</button>
</div>
