<script lang="ts">
  import type { MaybePromise } from '$lib/types';

  export let hasUpdated: boolean;
  export let onUpdate: () => MaybePromise<void>;
  export let disableUpdateBtn: boolean;
  export let onReset: () => MaybePromise<void>;
</script>

<div class="grid gap-2 mt-4">
  <div class="flex w-full gap-2">
    <button class="btn variant-filled-primary" disabled={disableUpdateBtn} on:click={onUpdate}
      >Update</button
    >
    <button
      class="btn variant-filled hidden 2md:block"
      disabled={!hasUpdated}
      on:click={onReset}
    >
      Reset
    </button>
  </div>
</div>
