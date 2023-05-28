<script lang="ts">
  import { Setting, Settings } from '$components';
  import { z } from 'zod';
  import { setSettingError, trimStringValues } from '$lib/utils';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { error, sidebar } from '$stores';
  import { onMount } from 'svelte';
  import type { PageServerData } from './$types';
  import type { NullPartial } from '$types';

  export let data: PageServerData;

  let originalObj = { ...data } as NullPartial<PageServerData, true>;
  let currentObj = { ...originalObj };
  let isOpenRank = currentObj.lowerRankRange === -1;
  let lowerRankRange = currentObj.lowerRankRange === -1 ? 1 : currentObj.lowerRankRange;
  let upperRankRange = currentObj.upperRankRange === -1 ? 10000 : currentObj.upperRankRange;
  let errors: Partial<Record<Exclude<keyof PageServerData, 'useBWS' | 'id'>, string>> = {};

  onMount(() => {
    sidebar.setSelected('Settings', 'Settings', 'General');
  });

  $: {
    currentObj.lowerRankRange = isOpenRank ? -1 : lowerRankRange;
    currentObj.upperRankRange = isOpenRank ? -1 : upperRankRange;
    currentObj = { ...currentObj };
  }

  function onUndo() {
    currentObj = originalObj;
  }

  async function onUpdate() {
    currentObj = trimStringValues(currentObj);
    let { name, acronym } = currentObj;

    if (!name || !acronym) return;

    try {
      let isNameUnique = await trpc($page).validation.isTournamentNameUnique.query(name);

      if (!isNameUnique) {
        error.set($error, 'Tournament name is already taken.', 'close', false);
        return;
      }

      await trpc($page).tournaments.updateTournament.mutate({
        tournamentId: data.id,
        where: {
          id: data.id
        },
        data: {
          ...currentObj,
          name,
          acronym
        }
      });

      originalObj = currentObj;
    } catch (err) {
      console.error(err);
      error.set($error, err, 'close', true);
    }
  }

  $: {
    let required = {
      required_error: 'This field is required'
    };

    let num = z.number(required).int();

    let name = z
        .string(required)
        .max(50)
        .safeParse(currentObj.name || undefined),
      acronym = z
        .string(required)
        .max(8)
        .safeParse(currentObj.acronym || undefined),
      lowerRankRange = (
        isOpenRank
          ? num
          : num.lt(currentObj.upperRankRange || 1, {
              message: 'Input must be less than the upper rank range limit'
            })
      ).safeParse(currentObj.lowerRankRange || undefined),
      upperRankRange = (
        isOpenRank
          ? num
          : num.gt(currentObj.lowerRankRange || 10000, {
              message: 'Input must be greater than the lower rank range limit'
            })
      ).safeParse(currentObj.upperRankRange || undefined);

    errors = {
      name: setSettingError(name),
      acronym: setSettingError(acronym),
      lowerRankRange: setSettingError(lowerRankRange),
      upperRankRange: setSettingError(upperRankRange)
    };
  }
</script>

<div class="center-content">
  <h1>Settings</h1>
  <Settings on:undo={onUndo} on:update={onUpdate} {currentObj} {originalObj} {errors}>
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
    <Setting label="Is open rank?" type="boolean" bind:value={isOpenRank} />
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
    <Setting label="Use BWS formula?" type="boolean" final bind:value={currentObj.useBWS} />
  </Settings>
</div>
