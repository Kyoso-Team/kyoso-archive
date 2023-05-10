<script lang="ts">
  import { Setting, Settings } from '$components';
  import { z } from 'zod';
  import { setSettingError, trimStringValues } from '$lib/utils';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { error, sidebar } from '$stores';
  import { onMount } from 'svelte';
  import type { NullPartial } from '$types';
  import type { PageServerData } from './$types';

  export let data: PageServerData;

  let originalObj = { ...data } as NullPartial<PageServerData, true, 'banOrder'>;
  let currentObj = { ...originalObj };
  let errors: Partial<Record<'pickTime' | 'startTime', string>> = {};

  onMount(() => {
    sidebar.setSelected('Settings', 'Referee', 'General');
  });

  $: {
    let num = z
      .number({
        required_error: 'This field is required'
      })
      .int()
      .gte(1);

    let pickTime = num.safeParse(
        typeof currentObj.pickTimerLength === 'number' ? currentObj.pickTimerLength : undefined
      ),
      startTime = num.safeParse(
        typeof currentObj.startTimerLength === 'number' ? currentObj.startTimerLength : undefined
      );

    errors = {
      pickTime: setSettingError(pickTime),
      startTime: setSettingError(startTime)
    };
  }

  function onUndo() {
    currentObj = originalObj;
  }

  async function onUpdate() {
    currentObj = trimStringValues(currentObj);
    let { startTimerLength, pickTimerLength } = currentObj;

    if (!startTimerLength || !pickTimerLength) return;

    try {
      await trpc($page).tournaments.updateTournament.mutate({
        tournamentId: data.id,
        where: {
          id: data.id
        },
        data: {
          ...currentObj,
          startTimerLength,
          pickTimerLength
        }
      });

      originalObj = currentObj;
    } catch (err) {
      console.error(err);
      error.set($error, err, 'close', true);
    }
  }
</script>

<div class="center-content">
  <h1>Referee Settings</h1>
  <Settings
    on:undo={onUndo}
    on:update={onUpdate}
    {currentObj}
    {originalObj}
    {errors}
  >
    <Setting
      label="Start timer length"
      type="number"
      error={errors.startTime}
      sub={`!mp start ${currentObj.startTimerLength || 0}`}
      bind:value={currentObj.startTimerLength}
    />
    <Setting
      label="Pick timer length"
      type="number"
      error={errors.pickTime}
      sub={`!mp timer ${currentObj.pickTimerLength || 0}`}
      bind:value={currentObj.pickTimerLength}
    />
    <Setting
      label="Are double picks allowed?"
      type="boolean"
      bind:value={currentObj.doublePickAllowed}
    />
    <Setting
      label="Are double bans allowed?"
      type="boolean"
      bind:value={currentObj.doubleBanAllowed}
    />
    <Setting
      label="Always force NoFail?"
      type="boolean"
      bind:value={currentObj.alwaysForceNoFail}
    />
    <Setting
      label="Win condition"
      type="select"
      values={[{
        label: 'Highest score',
        value: 'Score'
      }, {
        label: 'Highest accuracy',
        value: 'Accuracy'
      }, {
        label: 'Highest combo',
        value: 'Combo'
      }, {
        label: 'Lowest miss count',
        value: 'Misses'
      }]}
      bind:value={currentObj.winCondition}
    />
    <Setting
      label="Ban order"
      type="select"
      values={['ABABAB', 'ABBAAB']}
      bind:value={currentObj.banOrder}
    />
    <Setting label="Roll rules" type="text" bind:value={currentObj.rollRules} />
    <Setting label="Warmup rules" type="text" bind:value={currentObj.warmupRules} />
    <Setting label="Late procedures" type="text" final bind:value={currentObj.lateProcedures} />
  </Settings>
</div>
