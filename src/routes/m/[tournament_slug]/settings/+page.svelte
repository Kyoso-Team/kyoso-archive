<script lang="ts">
  import * as f from '$lib/form-validation';
  import { page } from '$app/stores';
  import { portal } from 'svelte-portal';
  import { SEO, Tooltip } from '$components/general';
  import { Checkbox, Number, Select, Text } from '$components/form';
  import { getToastStore, popup } from '@skeletonlabs/skeleton';
  import { goto, invalidate } from '$app/navigation';
  import { displayError, isDatePast, keys, toastError, toastSuccess, tooltip } from '$lib/utils';
  import { User, AlertTriangle } from 'lucide-svelte';
  import { createForm, createFunctionQueue, loading } from '$stores';
  import {
    baseTournamentFormSchemas,
    rankRangeFormSchemas,
    baseTeamSettingsFormSchemas,
    tournamentTypeOptions
  } from '$lib/constants';
  import { fade } from 'svelte/transition';
  import { trpc } from '$lib/trpc';
  import { Modal, Backdrop } from '$components/layout';
  import type { RefereeSettings, TRPCRouter } from '$types';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let t: typeof data.tournament = data.tournament;
  let canUpdateGeneralSettings = false;
  let canUpdateRefereeSettings = false;
  let generalSettingsHasUpdated = false;
  let showUpdateUrlSlugPrompt = false;
  let showUpdateNameAcronymPrompt = false;
  const toast = getToastStore();
  const fnQueue = createFunctionQueue();
  export const orderTypeOptions: Record<'linear' | 'snake', string> = {
    linear: 'Linear (ABABAB)',
    snake: 'Snake (ABBAAB)'
  };
  export const banAndProtectBehaviorOptions: Record<'true' | 'false', string> = {
    true: 'A ban on a protected map cancels out protection',
    false: 'A protected map can\'t be banned'
  };
  export const winConditionOptions: Record<RefereeSettings['winCondition'], string> = {
    accuracy: 'Best accuracy',
    combo: 'Best combo',
    score: 'Best score'
  };
  const tournamentForm = createForm(
    {
      ...baseTournamentFormSchemas,
      useBWS: f.boolean()
    },
    tournamentInitialValues()
  );
  const teamForm = createForm(
    {
      ...baseTeamSettingsFormSchemas,
      useTeamBanners: f.boolean()
    },
    teamSettingsInitialValues()
  );
  const rankRangeForm = createForm(
    rankRangeFormSchemas,
    rankRangeInitialValues()
  );
  const bwsForm = createForm(
    {
      x: f.number([f.notvalue(0), f.minValue(-10), f.maxValue(10)]),
      y: f.number([f.notvalue(0), f.minValue(-10), f.maxValue(10)]),
      z: f.number([f.notvalue(0), f.minValue(-10), f.maxValue(10)])
    },
    bwsInitialValues()
  );
  const refereeSettingsForm = createForm({
    pickTimerLength: f.number([f.integer(), f.minValue(1), f.maxValue(600)]),
    banTimerLength: f.number([f.integer(), f.minValue(1), f.maxValue(600)]),
    protectTimerLength: f.number([f.integer(), f.minValue(1), f.maxValue(600)]),
    readyTimerLength: f.number([f.integer(), f.minValue(1), f.maxValue(600)]),
    startTimerLength: f.number([f.integer(), f.minValue(1), f.maxValue(600)]),
    allowDoubleBan: f.boolean(),
    allowDoublePick: f.boolean(),
    allowDoubleProtect: f.boolean(),
    banOrder: f.union(keys(orderTypeOptions)),
    pickOrder: f.union(keys(orderTypeOptions)),
    protectOrder: f.union(keys(orderTypeOptions)),
    alwaysForceNoFail: f.boolean(),
    banAndProtectBehavior: f.union(keys(banAndProtectBehaviorOptions)),
    winCondition: f.union(keys(winConditionOptions))
  }, refereeSettingsInitialValues());
  const labels = {
    ...tournamentForm.labels,
    ...teamForm.labels,
    ...rankRangeForm.labels,
    ...bwsForm.labels,
    ...refereeSettingsForm.labels
  };
  const grid1Styles =
    'grid md:w-[calc(100%-1rem)] 2lg:w-[calc(100%-2rem)] md:grid-cols-[50%_50%] 2lg:grid-cols-[33.33%_33.34%_33.33%] gap-4';
  const grid2Styles =
    'grid 2lg:w-[calc(100%-2rem)] md:grid-cols-[100%] 2lg:grid-cols-[33.33%_calc(66.67%+1rem)] gap-4';

  function tournamentInitialValues() {
    return {
      acronym: t.acronym,
      name: t.name,
      openRank: !t.rankRange,
      type: t.type,
      urlSlug: t.urlSlug,
      useBWS: !!t.bwsValues
    };
  }

  function teamSettingsInitialValues() {
    return t.teamSettings && {
      maxTeamSize: t.teamSettings.maxTeamSize,
      minTeamSize: t.teamSettings.minTeamSize,
      useTeamBanners: t.teamSettings.useTeamBanners
    };
  }

  function rankRangeInitialValues() {
    return t.rankRange && {
      lower: t.rankRange.lower,
      upper: t.rankRange.upper
    };
  }

  function bwsInitialValues() {
    return t.bwsValues
      ? {
          x: t.bwsValues.x,
          y: t.bwsValues.y,
          z: t.bwsValues.z
        }
      : {
          x: 0.9937,
          y: 2,
          z: 1
        };
  }

  function refereeSettingsInitialValues() {
    return {
      pickTimerLength: t.refereeSettings.timerLength.pick,
      banTimerLength: t.refereeSettings.timerLength.ban,
      protectTimerLength: t.refereeSettings.timerLength.protect,
      readyTimerLength: t.refereeSettings.timerLength.ready,
      startTimerLength: t.refereeSettings.timerLength.start,
      allowDoubleBan: t.refereeSettings.allow.doubleBan,
      allowDoublePick: t.refereeSettings.allow.doublePick,
      allowDoubleProtect: t.refereeSettings.allow.doubleProtect,
      banOrder: t.refereeSettings.order.ban,
      pickOrder: t.refereeSettings.order.pick,
      protectOrder: t.refereeSettings.order.protect,
      alwaysForceNoFail: t.refereeSettings.alwaysForceNoFail,
      banAndProtectBehavior: t.refereeSettings.banAndProtectCancelOut ? 'true' : 'false',
      winCondition: t.refereeSettings.winCondition
    };
  }

  function overrideInitialValues() {
    tournamentForm.overrideInitialValues(tournamentInitialValues());
    teamForm.overrideInitialValues(teamSettingsInitialValues() || {});
    rankRangeForm.overrideInitialValues(rankRangeInitialValues() || {});
    bwsForm.overrideInitialValues(bwsInitialValues());
    refereeSettingsForm.overrideInitialValues(refereeSettingsInitialValues());
  }

  async function updateTournament<T extends 'updateTournament' | 'updateTournamentDates'>(procedure: T, input: TRPCRouter<true>['tournaments'][T]['data'], successMsg: string) {
    let tournament!: TRPCRouter['tournaments']['updateTournament'];
    loading.set(true);

    try {
      if (procedure === 'updateTournament') {
        tournament = await trpc($page).tournaments.updateTournament.mutate({
          tournamentId: data.tournament.id,
          data: input
        });
      } else {
        await trpc($page).tournaments.updateTournamentDates.mutate({
          tournamentId: data.tournament.id,
          data: input
        });
      }
    } catch (err) {
      displayError(toast, err);
    }

    if (typeof tournament === 'string') {
      loading.set(false);
      toastError(toast, tournament);
      return;
    }

    if (input.urlSlug) {
      await goto(`/m/${input.urlSlug}/settings`, { invalidateAll: true });
    } else {
      await invalidate('reload:manage_settings');
    }
    
    overrideInitialValues();
    loading.set(false);
    toastSuccess(toast, successMsg);
  }

  async function updateGeneralSettings() {
    const { acronym, name, type, urlSlug } = tournamentForm.getFinalValue($tournamentForm, { updatedFieldsOnly: true });
    const teamSettings = isTeamBased ? teamForm.getFinalValue($teamForm) : undefined;
    const rankRange = !isOpenRank ? rankRangeForm.getFinalValue($rankRangeForm) : undefined;
    const bwsValues = useBWS ? bwsForm.getFinalValue($bwsForm) : undefined;

    if (teamSettings && teamSettings.minTeamSize > teamSettings.maxTeamSize) {
      toastError(toast, 'The minimum team size must be less than or equal to the maximum');
      return;
    }

    if (rankRange && rankRange.upper && rankRange.lower > rankRange.upper) {
      toastError(toast, 'The lower rank range limit must be less than or equal to the maximum');
      return;
    }

    fnQueue.createQueue([
      () => {
        if ($tournamentForm.updated.urlSlug) {
          showUpdateUrlSlugPrompt = true;
          return;
        }

        return 'next';
      },
      () => {
        if (isPublic && ($tournamentForm.updated.name || $tournamentForm.updated.acronym)) {
          showUpdateNameAcronymPrompt = true;
          return;
        }

        return 'next';
      },
      async () => {
        await updateTournament('updateTournament', {
          acronym,
          name,
          type,
          urlSlug,
          teamSettings: teamSettings ? teamSettings : null,
          rankRange: rankRange ? rankRange : null,
          bwsValues: bwsValues ? bwsValues : null
        }, 'Updated general settings successfully');

        fnQueue.clearQueue();
      }
    ]);

    fnQueue.nextFunction($fnQueue);
  }

  async function updateRefereeSettings() {
    const { allowDoubleBan, allowDoublePick, allowDoubleProtect, banOrder, pickOrder, protectOrder, alwaysForceNoFail, banAndProtectBehavior, winCondition, startTimerLength, readyTimerLength, banTimerLength, protectTimerLength, pickTimerLength } = refereeSettingsForm.getFinalValue($refereeSettingsForm);

    await updateTournament('updateTournament', {
      refereeSettings: {
        alwaysForceNoFail,
        winCondition,
        banAndProtectCancelOut: banAndProtectBehavior === 'true',
        allow: {
          doubleBan: allowDoubleBan,
          doublePick: allowDoublePick,
          doubleProtect: allowDoubleProtect
        },
        order: {
          ban: banOrder,
          pick: pickOrder,
          protect: protectOrder
        },
        timerLength: {
          start: startTimerLength,
          ready: readyTimerLength,
          ban: banTimerLength,
          protect: protectTimerLength,
          pick: pickTimerLength
        }
      }
    }, 'Updated referee settings successfully');
  }

  function onUpdateUrlSlug() {
    showUpdateUrlSlugPrompt = false;
    fnQueue.nextFunction($fnQueue);
  }

  function onUpdateNameAcronym() {
    showUpdateNameAcronymPrompt = false;
    fnQueue.nextFunction($fnQueue);
  }

  function clearFnQueue() {
    fnQueue.clearQueue();
    showUpdateUrlSlugPrompt = false;
    showUpdateNameAcronymPrompt = false;
  }

  $: {
    const tournamentFormIsValid = $tournamentForm.canSubmit;
    const teamSettingsFormIsValid = isTeamBased ? $teamForm.canSubmit : true;
    const rankRangeFormIsValid = !isOpenRank ? $rankRangeForm.canSubmit : true;
    const bwsFormIsValid = useBWS ? $bwsForm.canSubmit : true;
    const isValid =
      tournamentFormIsValid && teamSettingsFormIsValid && rankRangeFormIsValid && bwsFormIsValid;

    generalSettingsHasUpdated =
      $tournamentForm.hasUpdated ||
      $teamForm.hasUpdated ||
      $rankRangeForm.hasUpdated ||
      $bwsForm.hasUpdated;
    canUpdateGeneralSettings = generalSettingsHasUpdated && isValid;
  }

  $: canUpdateRefereeSettings = $refereeSettingsForm.hasUpdated && $refereeSettingsForm.canSubmit;
  $: t = data.tournament;
  $: isPublic = isDatePast(t.publishedAt);
  $: isTeamBased = ['teams', 'draft'].includes($tournamentForm.value.type as any);
  $: isOpenRank = $tournamentForm.value.openRank;
  $: useBWS = $tournamentForm.value.useBWS;
</script>

<SEO
  page={$page}
  title={`${data.tournament.acronym} - Settings`}
  description={`Manage settings for ${data.tournament.acronym}`}
  noIndex
/>
{#if showUpdateUrlSlugPrompt}
  <Backdrop>
    <Modal>
      <span class="title">Update URL Slug</span>
      <p>Are you sure you want to update this tournament's URL slug? This will make links containing the current URL slug obsolete{isPublic ? ' and will likely hurt the tournament\'s discoverability' : ''}.</p>
      <div class="actions">
        <button class="btn variant-filled-primary" on:click={onUpdateUrlSlug}>Update</button>
        <button class="btn variant-filled" on:click={clearFnQueue}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
{#if showUpdateNameAcronymPrompt}
  <Backdrop>
    <Modal>
      <span class="title">Update {$tournamentForm.updated.name ? 'Name' : ''} {$tournamentForm.updated.name && $tournamentForm.updated.acronym ? ' & ' : ''} {$tournamentForm.updated.acronym ? 'Acronym' : ''}</span>
      <p>Are you sure you want to update this tournament's {$tournamentForm.updated.name ? 'name' : ''} {$tournamentForm.updated.name && $tournamentForm.updated.acronym ? ' and ' : ''} {$tournamentForm.updated.acronym ? 'acronym' : ''}? This will likely hurt the tournament's discoverability.</p>
      <div class="actions">
        <button class="btn variant-filled-primary" on:click={onUpdateNameAcronym}>Update</button>
        <button class="btn variant-filled" on:click={clearFnQueue}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
<h1 class="m-title" use:portal={'#page-title'}>Settings</h1>
<ol class="breadcrumb" use:portal={'#breadcrumbs'}>
  <li class="crumb">
    <a class="anchor" href={`/m/${data.tournament.urlSlug}`}>{data.tournament.acronym}</a>
  </li>
  <li class="crumb-separator" aria-hidden>&rsaquo;</li>
  <li class="crumb">Settings</li>
</ol>
<main class="main flex justify-center">
  <div class="w-full max-w-5xl">
    <h2>General Settings</h2>
    <div class="mt-4 w-full card p-4 flex flex-col gap-4">
      <div class={grid1Styles}>
        <Text form={tournamentForm} label={labels.name} legend="Name" disabled={!data.isHost}>
          <svelte:fragment slot="corner">
            {#if !data.isHost}
              <div
                class="absolute top-0 right-0 !mt-0 bg-error-500 rounded-md w-6 h-6 flex justify-center items-center [&>*]:pointer-events-none"
                use:popup={tooltip(`not-host-${labels.name}`)}
              >
                <User size={20} class="stroke-black" />
              </div>
              <Tooltip
                target={`not-host-${labels.name}`}
                label="Only the host can update this setting"
              />
            {/if}
          </svelte:fragment>
        </Text>
        <Text
          form={tournamentForm}
          label={labels.acronym}
          legend="Acronym"
          disabled={!data.isHost}
        />
        <Text
          form={tournamentForm}
          label={labels.urlSlug}
          legend="URL slug"
          disabled={!data.isHost}
        />
      </div>
      <div class="line-b" />
      <div class={grid1Styles}>
        <Select
          form={tournamentForm}
          label={labels.type}
          legend="Type"
          options={tournamentTypeOptions}
          disabled={!data.isHost}
        />
        <Number
          form={teamForm}
          label={labels.minTeamSize}
          legend="Min. team size"
          disabled={!isTeamBased || !data.isHost}
        />
        <Number
          form={teamForm}
          label={labels.maxTeamSize}
          legend="Max. team size"
          disabled={!isTeamBased || !data.isHost}
        />
        <Checkbox
          form={teamForm}
          label={labels.useTeamBanners}
          legend="Team banners?"
          disabled={!isTeamBased || !data.isHost}
        />
      </div>
      <div class="line-b" />
      <div class={grid2Styles}>
        <div>
          <Checkbox
            form={tournamentForm}
            label={labels.openRank}
            legend="Open rank?"
            disabled={!data.isHost}
          />
        </div>
        <div class="flex flex-col gap-2">
          <div class="grid sm:w-[calc(100%-1rem)] sm:grid-cols-[50%_50%] gap-4">
            <Number
              form={rankRangeForm}
              label={labels.lower}
              legend="Lower rank range"
              disabled={isOpenRank || !data.isHost}
            />
            <Number
              form={rankRangeForm}
              label={labels.upper}
              legend="Upper rank range"
              disabled={isOpenRank || !data.isHost}
            />
          </div>
          <span class="inline-block col-span-2 text-sm text-surface-600-300-token"
            >If the upper rank range is not set, it'll default to infinity.</span
          >
        </div>
      </div>
      <div class="line-b" />
      <div class={grid2Styles}>
        <div>
          <Checkbox
            form={tournamentForm}
            label={labels.useBWS}
            legend="Use BWS?"
            disabled={!data.isHost}
          />
        </div>
        <div class="flex flex-col gap-2">
          <div class="grid sm:w-[calc(100%-2rem)] sm:grid-cols-[33.33%_33.34%_33.33%] gap-4">
            <Number
              form={bwsForm}
              label={labels.x}
              legend="Value for X"
              disabled={!useBWS || !data.isHost}
            />
            <Number
              form={bwsForm}
              label={labels.y}
              legend="Value for Y"
              disabled={!useBWS || !data.isHost}
            />
            <Number
              form={bwsForm}
              label={labels.z}
              legend="Value for Z"
              disabled={!useBWS || !data.isHost}
            />
          </div>
          <span
            class="inline-block col-span-2 text-sm text-surface-600-300-token italic font-mono"
            >BWS = rank ^ ({$bwsForm.value.x || 'null'} ^ (badges ^ {$bwsForm.value.y || 'null'}) / {$bwsForm
              .value.z || 'null'})</span
          >
        </div>
      </div>
    </div>
    <div class="grid sm:grid-cols-[50%_50%] max-sm:gap-4 w-full mt-4">
      <div>
        {#if generalSettingsHasUpdated}
          <div class="card variant-soft-warning flex justify-center items-center py-[9px] px-5 sm:w-max" transition:fade={{ duration: 150 }}>
            <AlertTriangle size={20} class="mr-2" />
            You have unsaved changes
          </div>
        {/if}
      </div>
      <div class="flex justify-end w-full">
        <button class="btn variant-filled-primary" disabled={!canUpdateGeneralSettings} on:click={updateGeneralSettings}>Update</button>
      </div>
    </div>
    <div class="line-b my-8" />
    <h2>Referee Settings</h2>
    <div class="mt-4 w-full card p-4 flex flex-col gap-4">
      <div class={grid2Styles}>
        <Select
          form={refereeSettingsForm}
          label={labels.winCondition}
          options={winConditionOptions}
          legend="Win condition"
        />
        <Select
          form={refereeSettingsForm}
          label={labels.banAndProtectBehavior}
          options={banAndProtectBehaviorOptions}
          legend="Ban and protect behavior"
        />
      </div>
      <div class="line-b" />
      <p class="text-surface-600-300-token">All timer lengths are measured in seconds.</p>
      <div class={grid1Styles}>
        <Number
          form={refereeSettingsForm}
          label={labels.pickTimerLength}
          legend="Pick timer length"
        />
        <Number
          form={refereeSettingsForm}
          label={labels.banTimerLength}
          legend="Ban timer length"
        />
        <Number
          form={refereeSettingsForm}
          label={labels.protectTimerLength}
          legend="Protect timer length"
        />
        <Number
          form={refereeSettingsForm}
          label={labels.readyTimerLength}
          legend="Ready timer length"
        />
        <Number
          form={refereeSettingsForm}
          label={labels.startTimerLength}
          legend="Start timer length"
        />
      </div>
      <div class="line-b" />
      <div class={grid1Styles}>
        <Checkbox
          form={refereeSettingsForm}
          label={labels.allowDoublePick}
          legend="Allow double pick?"
        />
        <Checkbox
          form={refereeSettingsForm}
          label={labels.allowDoubleBan}
          legend="Allow double ban?"
        />
        <Checkbox
          form={refereeSettingsForm}
          label={labels.allowDoubleProtect}
          legend="Allow double protect?"
        />
        <Checkbox
          form={refereeSettingsForm}
          label={labels.alwaysForceNoFail}
          legend="Always force NoFail?"
        />
      </div>
      <div class="line-b" />
      <div class={grid1Styles}>
        <Select
          form={refereeSettingsForm}
          label={labels.pickOrder}
          options={orderTypeOptions}
          legend="Pick order"
        />
        <Select
          form={refereeSettingsForm}
          label={labels.banOrder}
          options={orderTypeOptions}
          legend="Ban order"
        />
        <Select
          form={refereeSettingsForm}
          label={labels.protectOrder}
          options={orderTypeOptions}
          legend="Protect order"
        />
      </div>
    </div>
    <div class="grid sm:grid-cols-[50%_50%] max-sm:gap-4 w-full mt-4">
      <div>
        {#if $refereeSettingsForm.hasUpdated}
          <div class="card variant-soft-warning flex justify-center items-center py-[9px] px-5 sm:w-max" transition:fade={{ duration: 150 }}>
            <AlertTriangle size={20} class="mr-2" />
            You have unsaved changes
          </div>
        {/if}
      </div>
      <div class="flex justify-end w-full">
        <button class="btn variant-filled-primary" disabled={!canUpdateRefereeSettings} on:click={updateRefereeSettings}>Update</button>
      </div>
    </div>
  </div>
</main>
