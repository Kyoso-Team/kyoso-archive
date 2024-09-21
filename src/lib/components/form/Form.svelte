<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { MaybePromise } from '$lib/types';

  export let submit: () => MaybePromise<void>;

  function onKeyDown(e: KeyboardEvent) {
    return e.key !== 'Enter';
  }
</script>

<form
  class="form"
  role="presentation"
  transition:fly={{ duration: 150, y: 100 }}
  on:keydown={onKeyDown}
  on:submit|preventDefault={submit}
>
  <slot name="header" />
  <div class="flex flex-col gap-4 my-8">
    <slot />
  </div>
  <div class="flex gap-2">
    <slot name="actions" />
  </div>
</form>
