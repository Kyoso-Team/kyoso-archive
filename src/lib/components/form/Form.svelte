<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { MaybePromise } from '@sveltejs/kit';

  export let submit: () => MaybePromise<void>;
</script>

<form class="form" transition:fly={{ duration: 150, y: 100 }} on:submit|preventDefault={submit}>
  <slot name="header" />
  <div class="flex flex-col gap-4 my-8">
    <slot />
  </div>
  <div class="flex gap-2">
    <slot name="actions" />
  </div>
</form>
