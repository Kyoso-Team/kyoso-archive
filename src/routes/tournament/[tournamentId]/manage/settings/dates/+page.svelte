<script lang="ts">
  import { SEO, Setting, Settings } from '$components';
  import { z } from 'zod';
  import { setSettingError } from '$lib/utils';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { error, tournamentSidebar } from '$stores';
  import { onMount } from 'svelte';
  import type { NullPartial } from '$types';
  import type { PageServerData } from './$types';

  export let data: PageServerData;

  let originalObj = { ...data } as NullPartial<
    PageServerData,
    true,
    'banOrder' | 'name' | 'acronym'
  >;
  let currentObj = { ...originalObj };
  let errors: Partial<
    Record<Exclude<keyof PageServerData, 'id' | 'goPublicOn' | 'concludesOn'>, string>
  > = {};

  onMount(() => {
    tournamentSidebar.setSelected('Settings', 'Settings', 'Dates');
  });

  $: {
    let playerOpen = (
        currentObj.playerRegsCloseOn ? z.date().max(currentObj.playerRegsCloseOn) : z.date()
      )
        .nullish()
        .safeParse(currentObj.playerRegsOpenOn),
      playerClose = (
        currentObj.playerRegsOpenOn ? z.date().min(currentObj.playerRegsOpenOn) : z.date()
      )
        .nullish()
        .safeParse(currentObj.playerRegsCloseOn),
      staffOpen = (
        currentObj.staffRegsCloseOn ? z.date().max(currentObj.staffRegsCloseOn) : z.date()
      )
        .nullish()
        .safeParse(currentObj.staffRegsOpenOn),
      staffClose = (
        currentObj.staffRegsOpenOn ? z.date().min(currentObj.staffRegsOpenOn) : z.date()
      )
        .nullish()
        .safeParse(currentObj.staffRegsCloseOn);

    errors = {
      playerRegsOpenOn: setSettingError(playerOpen),
      playerRegsCloseOn: setSettingError(playerClose),
      staffRegsOpenOn: setSettingError(staffOpen),
      staffRegsCloseOn: setSettingError(staffClose)
    };
  }

  function onUndo() {
    currentObj = originalObj;
  }

  async function onUpdate() {
    try {
      await trpc($page).tournaments.updateTournament.mutate({
        tournamentId: data.id,
        where: {
          id: data.id
        },
        data: currentObj
      });

      originalObj = currentObj;
    } catch (err) {
      console.error(err);
      error.set($error, err, 'close', true);
    }
  }
</script>

<SEO
  page={$page}
  title={`Dates - ${data.acronym}`}
  description={`Manage the dates for ${data.acronym} (${data.name})`}
  noIndex
/>
<div class="center-content">
  <h1>Dates</h1>
  <Settings on:undo={onUndo} on:update={onUpdate} {currentObj} {originalObj} {errors}>
    <Setting label="Make information public on" type="date" bind:value={currentObj.goPublicOn} />
    <Setting label="Conclude tournament on" type="date" bind:value={currentObj.concludesOn} />
    <Setting
      label="Open player registrations on"
      type="date"
      error={errors.playerRegsOpenOn}
      bind:value={currentObj.playerRegsOpenOn}
    />
    <Setting
      label="Close player registrations on"
      type="date"
      disabled={!currentObj.playerRegsOpenOn}
      error={errors.playerRegsCloseOn}
      bind:value={currentObj.playerRegsCloseOn}
    />
    <Setting
      label="Open staff registrations on"
      type="date"
      error={errors.staffRegsOpenOn}
      bind:value={currentObj.staffRegsOpenOn}
    />
    <Setting
      label="Close staff registrations on"
      type="date"
      disabled={!currentObj.staffRegsOpenOn}
      error={errors.staffRegsCloseOn}
      final
      bind:value={currentObj.staffRegsCloseOn}
    />
  </Settings>
</div>
