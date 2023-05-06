<script lang="ts">
  import { Setting, Settings } from '$components';
  import { z } from 'zod';
  import { setSettingError } from '$lib/utils';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { error } from '$stores';
  import type { NullPartial } from '$types';
  import type { PageServerData } from './$types';

  export let data: PageServerData;

  let originalObj = { ...data } as NullPartial<PageServerData, true, 'banOrder'>;
  let currentObj = { ...originalObj };
  let errors: Partial<Record<Exclude<keyof PageServerData, 'id'>, string>> = {};

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

<div class="center-content">
  <h1 class="pb-4">Settings</h1>
  <Settings
    tournamentId={data.id}
    tab={1}
    on:undo={onUndo}
    on:update={onUpdate}
    {currentObj}
    {originalObj}
    {errors}
  >
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
