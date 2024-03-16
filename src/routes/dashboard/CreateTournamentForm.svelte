<script lang="ts">
  import * as f from '$lib/form-validation';
  import { trpc } from '$lib/trpc';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { Form, Section, Text, Number, Select, Checkbox } from '$components/form';
  import { createForm } from '$stores';
  import { keys, displayError, toastError } from '$lib/utils';
  import type { TournamentType } from '$db';
  import type { InferEnum, TRPCRouter } from '$types';

  export let show: boolean;

  const toast = getToastStore();

  const typeOptions: Record<InferEnum<typeof TournamentType>, string> = {
    draft: 'Draft',
    solo: 'Solo',
    teams: 'Teams'
  };
  
  const main = createForm({
    name: f.string([f.minStrLength(2), f.maxStrLength(50)]),
    acronym: f.string([f.minStrLength(2), f.maxStrLength(8)]),
    urlSlug: f.string([f.minStrLength(2), f.maxStrLength(16), f.slug()]),
    type: f.union(keys(typeOptions)),
    openRank: f.boolean()
  });

  const team = createForm({
    minTeamSize: f.number([f.integer(), f.minValue(1), f.maxValue(16)]),
    maxTeamSize: f.number([f.integer(), f.minValue(1), f.maxValue(16)])
  });
  
  const rankRange = createForm({
    lower: f.number([f.integer(), f.minValue(1), f.maxSafeInt()]),
    upper: f.optional(f.number([f.integer(), f.minValue(1), f.maxSafeInt()]))
  });

  const labels = {
    ...main.labels,
    ...team.labels,
    ...rankRange.labels
  };

  async function submit() {
    const { acronym, name, type, urlSlug  } = main.getFinalValue($main);
    const teamValue = teamCondition ? team.getFinalValue($team) : undefined;
    const rankRangeValue = rankRangeCondition ? rankRange.getFinalValue($rankRange) : undefined;
    let tournament!: TRPCRouter['tournaments']['createTournament'];

    if (teamValue && teamValue.minTeamSize > teamValue.maxTeamSize) {
      toastError(toast, 'The minimum team size must be less than or equal to the maximum');
      return;
    }

    if (rankRangeValue && rankRangeValue.upper && rankRangeValue.lower > rankRangeValue.upper) {
      toastError(toast, 'The lower rank range limit must be less than or equal to the maximum');
      return;
    }

    try {
      tournament = await trpc($page).tournaments.createTournament.mutate({
        acronym,
        name,
        type,
        urlSlug,
        teamSettings: teamValue ? {
          maxTeamSize: teamValue.maxTeamSize,
          minTeamSize: teamValue.minTeamSize
        } : undefined,
        rankRange: rankRangeValue ? {
          lower: rankRangeValue.lower,
          upper: rankRangeValue.upper
        } : undefined
      });
    } catch (err) {
      displayError(toast, err);
    }

    if (typeof tournament === 'string') {
      toastError(toast, tournament);
      return;
    }

    show = false;
    goto(`/t/${tournament.urlSlug}`);
  }

  function cancel() {
    show = false;
  }

  $: teamCondition = ['teams', 'draft'].includes($main.value.type as any);
  $: rankRangeCondition = !$main.value.openRank;
</script>

<Form {submit}>
  <svelte:fragment slot="header">
    <span class="title">Create Tournament</span>
  </svelte:fragment>
  <Text form={main} label={labels.name} legend="Tournament name" />
  <Text form={main} label={labels.acronym} legend="Tournament acronym" />
  <Text form={main} label={labels.urlSlug} legend="URL slug">
    The string that will be used to navigate towards any pages related to the tournament.
    <svelte:fragment slot="preview">
      <strong>Example URL:</strong> {$page.url.origin}/t/{$main.value.urlSlug ? $main.value.urlSlug : '[slug]'}
    </svelte:fragment>
  </Text>
  <Select form={main} label={labels.type} legend="Tournament type" options={typeOptions} />
  {#if teamCondition}
    <Section>
      <Number form={team} label={labels.minTeamSize} legend="Min. team size" />
      <Number form={team} label={labels.maxTeamSize} legend="Max. team size" />
    </Section>
  {/if}
  <Checkbox form={main} label={labels.openRank} legend="Is it open rank?" />
  {#if rankRangeCondition}
    <Section>
      <Number form={rankRange} label={labels.lower} legend="Lower rank range" />
      <Number form={rankRange} label={labels.upper} legend="Upper rank range">
        If not set, it'll default to infinity.
      </Number>
    </Section>
  {/if}
  <svelte:fragment slot="actions">
    <button type="submit" class="btn variant-filled-primary" disabled={!(
      $main.canSubmit &&
      (teamCondition ? $team.canSubmit : true) &&
      (rankRangeCondition ? $rankRange.canSubmit : true)
    )}>Submit</button>
    <button type="button" class="btn variant-filled" on:click={cancel}>Cancel</button>
  </svelte:fragment>
</Form>
