<script lang="ts">
  import isEqual from 'lodash.isequal';
  import { TabGroup, Tab } from '@skeletonlabs/skeleton';
  import { Setting } from '$components';
  import { tournamentSettingsList } from '$lib/constants';
  import { goto } from '$app/navigation';
  import { z } from 'zod';
  import { setSettingError } from '$lib/utils';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { error } from '$stores';
  import type { PageServerData } from './$types';

  export let data: PageServerData;

  let tab = 0;
  let originalObj = { ... data };
  let currentObj = { ... data };
  let isOpenRank = currentObj.lowerRankRange === -1;
  let lowerRankRange = currentObj.lowerRankRange === -1 ? 1 : currentObj.lowerRankRange;
  let upperRankRange = currentObj.upperRankRange === -1 ? 10000 : currentObj.upperRankRange;
  let btnsEnabled = false;
  let errors: Partial<Record<'name' | 'acronym' | 'lowerRankRange' | 'upperRankRange', string>> = {};

  $: {
    currentObj.lowerRankRange = isOpenRank ? -1 : lowerRankRange;
    currentObj.upperRankRange = isOpenRank ? -1 : upperRankRange;
    currentObj = { ... currentObj };
  }

  function onUndoChanges() {
    currentObj = originalObj;
  }

  async function onUpdate() {
    try {
      let isNameUnique = await trpc($page).validation.isTournamentNameUnique.query(currentObj.name);
  
      if (!isNameUnique) {
        error.set($error, 'Tournament name is already taken.', 'close', false);
        return;
      }
  
      await trpc($page).tournaments.updateTournament.mutate({
        tournamentId: data.id,
        where: {
          id: data.id
        },
        data: currentObj
      });

      originalObj = currentObj;
    } catch(err) {
      console.error(err);
      error.set($error, err, 'close', true);
    }
  }

  $: {
    let required = {
      required_error: 'This field is required'
    };

    let num = z.number(required).int();

    let name = z.string(required).max(50).safeParse(currentObj.name),
      acronym = z.string(required).max(8).safeParse(currentObj.acronym),
      lowerRankRange = (
        isOpenRank
          ? num
          : num.lt(currentObj.upperRankRange, {
            message: 'Input must be less than the upper rank range limit'
          })
      ).safeParse(currentObj.lowerRankRange),
      upperRankRange = (
        isOpenRank
          ? num
          : num.gt(currentObj.lowerRankRange, {
            message: 'Input must be greater than the lower rank range limit'
          })
      ).safeParse(currentObj.upperRankRange);

    errors = {
      name: setSettingError(name),
      acronym: setSettingError(acronym),
      lowerRankRange: setSettingError(lowerRankRange),
      upperRankRange: setSettingError(upperRankRange)
    };
  }

  $: {
    let hasNotChanged = isEqual(originalObj, currentObj);
    let hasErrors = !!Object.values(errors).find((v) => typeof v === 'string');

    btnsEnabled = hasNotChanged || hasErrors;
  }

  $: {
    if (tab !== 0) {
      goto(`/tournament/${data.id}/manage/settings/${tournamentSettingsList[tab].toLowerCase()}`);
    }
  }
</script>

<div class="center-content">
  <h1 class="pb-4">Settings</h1>
  <TabGroup active="border-b-2 border-primary-500" border="border-b border-primary-800">
    {#each tournamentSettingsList as setting, i}
      <Tab name="settings" value={i} bind:group={tab}>{setting}</Tab>
    {/each}
    <svelte:fragment slot="panel">
      <div class="card">
        <Setting
          label="Tournament name"
          type="string"
          error={errors.name}
          bind:value={currentObj.name}
        />
        <Setting
          label="Tournament acronym"
          type="string"
          error={errors.acronym}
          bind:value={currentObj.acronym}
        />
        <Setting
          label="Is open rank?"
          type="boolean"
          bind:value={isOpenRank}
        />
        <Setting
          label="Lower rank range limit"
          type="number"
          error={isOpenRank ? undefined : errors.lowerRankRange}
          disabled={isOpenRank}
          bind:value={lowerRankRange}
        />
        <Setting
          label="Upper rank range limit"
          type="number"
          error={isOpenRank ? undefined : errors.upperRankRange}
          disabled={isOpenRank}
          bind:value={upperRankRange}
        />
        <Setting
          label="Use BWS formula?"
          type="boolean"
          final
          bind:value={currentObj.useBWS}
        />
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button class="btn variant-ringed-primary" disabled={btnsEnabled} on:click={onUndoChanges}>Undo Changes</button>
        <button class="btn variant-filled-primary" disabled={btnsEnabled} on:click={onUpdate}>Update</button>
      </div>
    </svelte:fragment>
  </TabGroup>
</div>