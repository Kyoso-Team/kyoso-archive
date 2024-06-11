<script lang="ts">
  import { trpc } from '$lib/trpc';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { Form, Section, Text, Number, Select, Checkbox } from '$components/form';
  import { createForm, loading } from '$stores';
  import { displayError, toastError } from '$lib/utils';
  import { tournamentTypeOptions, baseTournamentFormSchemas, baseTeamSettingsFormSchemas, rankRangeFormSchemas } from '$lib/constants';
  import { tournamentChecks } from '$lib/helpers';
  import type { TRPCRouter } from '$types';

  export let show: boolean;
  const toast = getToastStore();
  const mainForm = createForm(baseTournamentFormSchemas);
  const teamForm = createForm(baseTeamSettingsFormSchemas);
  const rankRangeForm = createForm(rankRangeFormSchemas);
  const labels = {
    ...mainForm.labels,
    ...teamForm.labels,
    ...rankRangeForm.labels
  };

  async function submit() {
    const { acronym, name, type, urlSlug } = mainForm.getFinalValue($mainForm);
    const teamSettings = isTeamBased ? teamForm.getFinalValue($teamForm) : undefined;
    const rankRange = !isOpenRank ? rankRangeForm.getFinalValue($rankRangeForm) : undefined;
    let tournament!: TRPCRouter['tournaments']['createTournament'];

    const err = tournamentChecks({ teamSettings, rankRange });

    if (err) {
      toastError(toast, err);
      return;
    }

    loading.set(true);

    try {
      tournament = await trpc($page).tournaments.createTournament.mutate({
        acronym,
        name,
        type,
        urlSlug,
        teamSettings: teamSettings
          ? {
              maxTeamSize: teamSettings.maxTeamSize,
              minTeamSize: teamSettings.minTeamSize
            }
          : undefined,
        rankRange: rankRange
          ? {
              lower: rankRange.lower,
              upper: rankRange.upper ? rankRange.upper : undefined
            }
          : undefined
      });
    } catch (err) {
      displayError(toast, err);
    }

    if (typeof tournament === 'string') {
      loading.set(false);
      toastError(toast, tournament);
      return;
    }

    await goto(`/m/${tournament.urlSlug}`);
    show = false;
    loading.set(false);
  }

  function cancel() {
    show = false;
  }

  $: isTeamBased = ['teams', 'draft'].includes($mainForm.value.type as any);
  $: isOpenRank = $mainForm.value.openRank;
</script>

<Form {submit}>
  <svelte:fragment slot="header">
    <span class="title">Create Tournament</span>
  </svelte:fragment>
  <Text form={mainForm} label={labels.name} legend="Tournament name" />
  <Text form={mainForm} label={labels.acronym} legend="Tournament acronym" />
  <Text form={mainForm} label={labels.urlSlug} legend="URL slug">
    The string that will be used to navigate towards any pages related to the tournament.
    <svelte:fragment slot="preview">
      <strong>Example URL:</strong>
      {$page.url.origin}/t/{$mainForm.value.urlSlug ? $mainForm.value.urlSlug : '[slug]'}
    </svelte:fragment>
  </Text>
  <Select form={mainForm} label={labels.type} legend="Tournament type" options={tournamentTypeOptions} />
  {#if isTeamBased}
    <Section>
      <Number form={teamForm} label={labels.minTeamSize} legend="Min. team size" />
      <Number form={teamForm} label={labels.maxTeamSize} legend="Max. team size" />
    </Section>
  {/if}
  <Checkbox form={mainForm} label={labels.openRank} legend="Is it open rank?" />
  {#if !isOpenRank}
    <Section>
      <Number form={rankRangeForm} label={labels.lower} legend="Lower rank range" />
      <Number form={rankRangeForm} label={labels.upper} legend="Upper rank range">
        If not set, it'll default to infinity.
      </Number>
    </Section>
  {/if}
  <svelte:fragment slot="actions">
    <button
      type="submit"
      class="btn variant-filled-primary"
      disabled={!(
        $mainForm.canSubmit &&
        (isTeamBased ? $teamForm.canSubmit : true) &&
        (!isOpenRank ? $rankRangeForm.canSubmit : true)
      )}>Submit</button
    >
    <button type="button" class="btn variant-filled" on:click={cancel}>Cancel</button>
  </svelte:fragment>
</Form>
