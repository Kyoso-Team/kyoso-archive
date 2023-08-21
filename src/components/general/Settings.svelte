<script lang="ts">
  import isEqual from 'lodash.isequal';
  import { createEventDispatcher } from 'svelte';

  const undoDispatcher = createEventDispatcher<{
    undo: never;
  }>();
  const updateDispatcher = createEventDispatcher<{
    update: never;
  }>();

  export let originalObj: Record<string, unknown>;
  export let currentObj: Record<string, unknown>;
  export let errors: Record<string, unknown>;
  let btnsDisabled = false;

  function onUndoChanges() {
    undoDispatcher('undo');
  }

  function onUpdate() {
    updateDispatcher('update');
  }

  $: {
    let hasNotChanged = isEqual(originalObj, currentObj);
    let hasErrors = !!Object.values(errors).find((v) => typeof v === 'string');

    btnsDisabled = hasNotChanged || hasErrors;
  }
</script>

<div class="mt-4">
  <slot name="header" />
  <div class="card w-80 sm:w-[32rem]">
    <slot />
  </div>
  <div class="mt-4 flex justify-end gap-2">
    <button class="btn variant-ringed-primary" disabled={btnsDisabled} on:click={onUndoChanges}
      >Undo Changes</button
    >
    <button class="btn variant-filled-primary" disabled={btnsDisabled} on:click={onUpdate}
      >Update</button
    >
  </div>
</div>
