<script lang="ts">
  import * as f from '$lib/form-validation';
  import OtherDate from './OtherDate.svelte';
  import Link from './Link.svelte';
  import ManageOtherDateForm from './ManageOtherDateForm.svelte';
  import ManageLinkForm from './ManageLinkForm.svelte';
  import { page } from '$app/stores';
  import { portal } from 'svelte-portal';
  import { SEO, Tooltip } from '$components/general';
  import { Checkbox, Number, Select, Text, DateTime } from '$components/form';
  import { getToastStore, popup } from '@skeletonlabs/skeleton';
  import { goto, invalidate } from '$app/navigation';
  import { displayError, isDatePast, keys, toastError, toastSuccess, tooltip } from '$lib/utils';
  import { User, AlertTriangle } from 'lucide-svelte';
  import { createForm, createFunctionQueue, loading } from '$stores';
  import { dragHandleZone } from 'svelte-dnd-action';
  import { fade } from 'svelte/transition';
  import { trpc } from '$lib/trpc';
  import { Modal, Backdrop } from '$components/layout';
  import { tournamentChecks, tournamentDatesChecks } from '$lib/helpers';
  import { flip } from 'svelte/animate';
  import {
    baseTournamentFormSchemas,
    rankRangeFormSchemas,
    baseTeamSettingsFormSchemas,
    tournamentTypeOptions
  } from '$lib/constants';
  import type { RefereeSettings, TRPCRouter } from '$types';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let t: typeof data.tournament = data.tournament;
  let otherDates = t.other;
  let links = t.links.map((link) => ({ ...link, id: link.label }));
  let canUpdateGeneralSettings = false;
  let canUpdateRefereeSettings = false;
  let canUpdateDates = false;
  let datesHaveUpdated = false;
  let otherDatesHaveUpdated = false;
  let linksHaveUpdated = false;
  let generalSettingsHasUpdated = false;
  let showUpdateUrlSlugPrompt = false;
  let showUpdateNameAcronymPrompt = false;
  let showManageOtherDateForm = false;
  let showManageLinkForm = false;
  let updatingOtherDateIndex: number | undefined;
  let updatingLinkIndex: number | undefined;
  const now = new Date().getTime();
  const aYear = new Date(31_556_952_000).getTime();
  const toast = getToastStore();
  const fnQueue = createFunctionQueue();
  const orderTypeOptions: Record<'linear' | 'snake', string> = {
    linear: 'Linear (ABABAB)',
    snake: 'Snake (ABBAAB)'
  };
  const banAndProtectBehaviorOptions: Record<'true' | 'false', string> = {
    true: 'A ban on a protected map cancels out protection',
    false: 'A protected map can\'t be banned'
  };
  const winConditionOptions: Record<RefereeSettings['winCondition'], string> = {
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
      x: f.number([f.notValue(0), f.minValue(-10), f.maxValue(10)]),
      y: f.number([f.notValue(0), f.minValue(-10), f.maxValue(10)]),
      z: f.number([f.notValue(0), f.minValue(-10), f.maxValue(10)])
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
  const datesForm = createForm({
    publishedAt: f.optional(f.date([f.minDate(new Date(now)), f.maxDate(new Date(now + aYear))])),
    concludesAt: f.optional(f.date([f.minDate(new Date(now)), f.maxDate(new Date(now + aYear))])),
    playerRegsOpenAt: f.optional(f.date([f.minDate(new Date(now)), f.maxDate(new Date(now + aYear))])),
    playerRegsCloseAt: f.optional(f.date([f.minDate(new Date(now)), f.maxDate(new Date(now + aYear))])),
    staffRegsOpenAt: f.optional(f.date([f.minDate(new Date(now)), f.maxDate(new Date(now + aYear))])),
    staffRegsCloseAt: f.optional(f.date([f.minDate(new Date(now)), f.maxDate(new Date(now + aYear))]))
  }, datesInitialValues());
  const labels = {
    ...tournamentForm.labels,
    ...teamForm.labels,
    ...rankRangeForm.labels,
    ...bwsForm.labels,
    ...refereeSettingsForm.labels,
    ...datesForm.labels
  };
  const grid1Styles =
    'grid md:w-[calc(100%-1rem)] 2lg:w-[calc(100%-2rem)] md:grid-cols-[50%_50%] 2lg:grid-cols-[33.33%_33.34%_33.33%] gap-4';
  const grid2Styles =
    'grid 2lg:w-[calc(100%-2rem)] md:grid-cols-[100%] 2lg:grid-cols-[33.33%_calc(66.67%+1rem)] gap-4';
  const grid3Styles =
    'grid sm:grid-cols-[50%_50%] gap-4 sm:w-[calc(100%-1rem)]';

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
      banAndProtectBehavior: t.refereeSettings.banAndProtectCancelOut ? 'true' as const : 'false' as const,
      winCondition: t.refereeSettings.winCondition
    };
  }

  function datesInitialValues() {
    return {
      publishedAt: t.publishedAt,
      concludesAt: t.concludesAt,
      playerRegsOpenAt: t.playerRegsOpenAt,
      playerRegsCloseAt: t.playerRegsCloseAt,
      staffRegsOpenAt: t.staffRegsOpenAt,
      staffRegsCloseAt: t.staffRegsCloseAt
    };
  }

  function overrideInitialValues() {
    tournamentForm.overrideInitialValues(tournamentInitialValues());
    teamForm.overrideInitialValues(teamSettingsInitialValues() || {});
    rankRangeForm.overrideInitialValues(rankRangeInitialValues() || {});
    bwsForm.overrideInitialValues(bwsInitialValues());
    refereeSettingsForm.overrideInitialValues(refereeSettingsInitialValues());
    datesForm.overrideInitialValues(datesInitialValues());
  }

  async function updateTournament<T extends 'updateTournament' | 'updateTournamentDates'>(procedure: T, input: TRPCRouter<true>['tournaments'][T]['data'], successMsg: string) {
    let tournament!: TRPCRouter['tournaments']['updateTournament'] | TRPCRouter['tournaments']['updateTournamentDates'];
    loading.set(true);

    try {
      if (procedure === 'updateTournament') {
        tournament = await trpc($page).tournaments.updateTournament.mutate({
          tournamentId: data.tournament.id,
          data: input
        });
      } else {
        tournament = await trpc($page).tournaments.updateTournamentDates.mutate({
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
    
    t = data.tournament;
    overrideInitialValues();
    loading.set(false);
    toastSuccess(toast, successMsg);
  }

  async function updateGeneralSettings() {
    const { acronym, name, type, urlSlug } = tournamentForm.getFinalValue($tournamentForm, { updatedFieldsOnly: true });
    const teamSettings = isTeamBased ? teamForm.getFinalValue($teamForm) : undefined;
    const rankRange = !isOpenRank ? rankRangeForm.getFinalValue($rankRangeForm) : undefined;
    const bwsValues = useBWS ? bwsForm.getFinalValue($bwsForm) : undefined;
    const err = tournamentChecks({ teamSettings, rankRange });

    if (err) {
      toastError(toast, err);
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
          rankRange: rankRange ? {
            lower: rankRange.lower,
            upper: rankRange.upper || undefined
          } : null,
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

  async function updateDates() {
    const dates = datesForm.getFinalValue($datesForm);
    const err = tournamentDatesChecks(dates, dates);

    if (err) {
      toastError(toast, err);
      return;
    }

    await updateTournament('updateTournamentDates', {
      ...dates,
      other: otherDates
    }, 'Updated dates successfully');

    otherDatesHaveUpdated = false;
    otherDates = t.other;
  }

  async function updateLinks() {
    await updateTournament('updateTournament', { links }, 'Updated links successfully');

    linksHaveUpdated = false;
    links = t.links.map((link) => ({ ...link, id: link.label }));
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

  function onCreateOtherDate() {
    showManageOtherDateForm = true;
  }

  function onDeleteOtherDate(i: number) {
    otherDates.splice(i, 1);
    otherDates = [...otherDates];
    otherDatesHaveUpdated = true;
  }

  function onUpdateOtherDate(i: number) {
    showManageOtherDateForm = true;
    updatingOtherDateIndex = i;
  }

  function onCreateLink() {
    showManageLinkForm = true;
  }

  function onDeleteLink(i: number) {
    links.splice(i, 1);
    links = [...links];
    linksHaveUpdated = true;
  }

  function onUpdateLink(i: number) {
    showManageLinkForm = true;
    updatingLinkIndex = i;
  }

  function sortLinks(e: CustomEvent, finalize?: boolean) {
    links = e.detail.items;
    
    if (finalize && links.some(({ label }, i) => label !== t.links[i].label)) {
      linksHaveUpdated = true;
    }
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
      (isTeamBased ? $teamForm.hasUpdated : false) ||
      (!isOpenRank ? $rankRangeForm.hasUpdated : false) ||
      (useBWS ? $bwsForm.hasUpdated : false);
    canUpdateGeneralSettings = generalSettingsHasUpdated && isValid;
  }

  $: {
    datesHaveUpdated = $datesForm.hasUpdated || otherDatesHaveUpdated;
    canUpdateDates = datesHaveUpdated && $datesForm.canSubmit;
  }

  $: canUpdateRefereeSettings = $refereeSettingsForm.hasUpdated && $refereeSettingsForm.canSubmit;
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
{#if showManageOtherDateForm}
  <Backdrop>
    <ManageOtherDateForm bind:show={showManageOtherDateForm} bind:otherDates={otherDates} bind:otherDatesHaveUpdated={otherDatesHaveUpdated} bind:editIndex={updatingOtherDateIndex} />
  </Backdrop>
{/if}
{#if showManageLinkForm}
  <Backdrop>
    <ManageLinkForm bind:show={showManageLinkForm} bind:links={links} bind:linksHaveUpdated={linksHaveUpdated} bind:editIndex={updatingLinkIndex} />
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
    <div class={`${grid3Styles} mt-4`}>
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
    <h2>Dates</h2>
    <div class="mt-4 w-full card p-4 flex flex-col gap-4">
      <div class={grid1Styles}>
        <DateTime
          form={datesForm}
          label={labels.publishedAt}
          legend="Publish at"
          disabled={!data.isHost}
        />
        <DateTime
          form={datesForm}
          label={labels.concludesAt}
          legend="Concludes at"
          disabled={!data.isHost}
        />
        <DateTime
          form={datesForm}
          label={labels.playerRegsOpenAt}
          legend="Player regs. open at"
          disabled={!data.isHost}
        />
        <DateTime
          form={datesForm}
          label={labels.playerRegsCloseAt}
          legend="Player regs. close at"
          disabled={!data.isHost}
        />
        <DateTime
          form={datesForm}
          label={labels.staffRegsOpenAt}
          legend="Staff regs. open at"
          disabled={!data.isHost}
        />
        <DateTime
          form={datesForm}
          label={labels.staffRegsCloseAt}
          legend="Staff regs. close at"
          disabled={!data.isHost}
        />
      </div>
      {#if otherDates.length > 0}
        <div class="line-b" />
        <div class="flex flex-col gap-4">
          {#each otherDates as date, i (date.label)}
            <div animate:flip={{ duration: 150 }}>
              <OtherDate {date} onUpdate={() => onUpdateOtherDate(i)} onDelete={() => onDeleteOtherDate(i)} />
            </div>
          {/each}
        </div>
      {/if}
    </div>
    <div class={`${grid3Styles} mt-4`}>
      <div>
        {#if datesHaveUpdated}
          <div class="card variant-soft-warning flex justify-center items-center py-[9px] px-5 sm:w-max" transition:fade={{ duration: 150 }}>
            <AlertTriangle size={20} class="mr-2" />
            You have unsaved changes
          </div>
        {/if}
      </div>
      <div class="flex justify-end w-full gap-2">
        <button class="btn btn-sm variant-filled" disabled={otherDates.length > 20} on:click={onCreateOtherDate}>Add</button>
        <button class="btn variant-filled-primary" disabled={!canUpdateDates} on:click={updateDates}>Update</button>
      </div>
    </div>
    <div class="line-b my-8" />
    <h2>Links</h2>
    <span class="text-warning-500 mt-2 block"><strong>Note for testers:</strong> We're working on designing the icons so it matches the rest of the website's icons, so for now, all icons are displayed with the default "link" icon.</span>
    <div class="mt-4 w-full card p-4 flex flex-col gap-4">
      {#if links.length === 0}
        <span class="text-surface-600-300-token">This tournament doesn't have any links.</span>
      {:else}
        <div class="flex flex-col gap-4" use:dragHandleZone={{
          items: links,
          flipDurationMs: 150,
          dropTargetClasses: ['card', 'variant-soft-surface'],
          dropTargetStyle: {
            border: 'none'
          }
        }} on:consider={sortLinks} on:finalize={(e) => sortLinks(e, true)}>
          {#each links as link, i (link.id)}
            <div animate:flip={{ duration: 150 }}>
              <Link {link} onUpdate={() => onUpdateLink(i)} onDelete={() => onDeleteLink(i)} />
            </div>
          {/each}
        </div>
      {/if}
    </div>
    <div class={`${grid3Styles} mt-4`}>
      <div>
        {#if linksHaveUpdated}
          <div class="card variant-soft-warning flex justify-center items-center py-[9px] px-5 sm:w-max" transition:fade={{ duration: 150 }}>
            <AlertTriangle size={20} class="mr-2" />
            You have unsaved changes
          </div>
        {/if}
      </div>
      <div class="flex justify-end w-full gap-2">
        <button class="btn btn-sm variant-filled" disabled={links.length > 20} on:click={onCreateLink}>Add</button>
        <button class="btn variant-filled-primary" disabled={!linksHaveUpdated} on:click={updateLinks}>Update</button>
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
    <div class={`${grid3Styles} mt-4`}>
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
