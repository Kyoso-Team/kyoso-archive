<script lang="ts">
  import isEqual from 'lodash.isequal';
  import type { MaybePromise } from '@sveltejs/kit';

  export let originalObj: Record<string, unknown>;
  export let currentObj: Record<string, unknown>;
  export let errors: Record<string, unknown>;
  export let onUndo: () => MaybePromise<void>;
  export let onUpdate: () => MaybePromise<void>;
  let btnsDisabled = false;

  $: {
    const hasNotChanged = isEqual(originalObj, currentObj);
    const hasErrors = !!Object.values(errors).find((v) => typeof v === 'string');

    btnsDisabled = hasNotChanged || hasErrors;
  }
</script>

<div class="mt-4">
  <slot name="header" />
  <div class="card w-80 sm:w-[32rem]">
    <slot />
  </div>
  <div class="mt-4 flex justify-end gap-2">
    <button class="btn variant-ringed-primary" disabled={btnsDisabled} on:click={onUndo}
      >Undo Changes</button
    >
    <button class="btn variant-filled-primary" disabled={btnsDisabled} on:click={onUpdate}
      >Update</button
    >
  </div>
</div>
