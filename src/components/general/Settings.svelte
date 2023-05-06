<script lang="ts">
  import isEqual from 'lodash.isequal';
  import { createEventDispatcher } from 'svelte';
  import { TabGroup, Tab } from '@skeletonlabs/skeleton';
  import { goto } from '$app/navigation';

  const settings = ['General', 'Dates', 'Links', 'Referee', 'Stats'];
  const undoDispatcher = createEventDispatcher<{
    undo: never;
  }>();
  const updateDispatcher = createEventDispatcher<{
    update: never;
  }>();

  export let tab: number;
  export let tournamentId: number;
  export let originalObj: Record<string, unknown>;
  export let currentObj: Record<string, unknown>;
  export let errors: Record<string, unknown>;
  let currentTab = tab;
  let btnsDisabled = false;

  function onUndoChanges() {
    undoDispatcher('undo');
  }

  function onUpdate() {
    updateDispatcher('update');
  }

  $: {
    if (tab !== currentTab) {
      goto(`/tournament/${tournamentId}/manage/settings/${settings[currentTab].toLowerCase()}`);
    }
  }

  $: {
    let hasNotChanged = isEqual(originalObj, currentObj);
    let hasErrors = !!Object.values(errors).find((v) => typeof v === 'string');

    btnsDisabled = hasNotChanged || hasErrors;
  }
</script>

<TabGroup
  active="border-b-2 border-primary-500"
  border="border-b border-primary-800"
  padding="px-2 py-1 sm:px-4 sm:py-2"
  justify="justify-center"
>
  {#each settings as setting, i}
    <Tab name="settings" value={i} bind:group={currentTab}>{setting}</Tab>
  {/each}
  <svelte:fragment slot="panel">
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
  </svelte:fragment>
</TabGroup>
