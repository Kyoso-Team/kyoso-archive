<script lang="ts">
  import * as f from '$lib/form-validation';
  import { page } from '$app/stores';
  import { Text, Number, Select, Checkbox } from '$components/form';
  import { createForm } from '$stores';
  import { fly, slide } from 'svelte/transition';
  import { keys } from '$lib/utils';
  import type { TournamentType } from '$db';
  import type { InferEnum } from '$types';

  export let show: boolean;

  const typeOptions: Record<InferEnum<typeof TournamentType>, string> = {
    draft: 'Draft',
    solo: 'Solo',
    teams: 'Teams'
  };
  
  const general = createForm({
    name: f.string([f.maxStrLength(50)]),
    acronym: f.string([f.maxStrLength(8)]),
    urlSlug: f.string([f.maxStrLength(16), f.slug()]),
    type: f.union(keys(typeOptions)),
    openRank: f.boolean()
  });

  const team = createForm({
    minTeamSize: f.number([f.integer(), f.minValue(1), f.maxValue(16)]),
    maxTeamSize: f.number([f.integer(), f.minValue(1), f.maxValue(16)])
  });
  
  const rankRange = createForm({
    lower: f.number([f.integer(), f.minValue(1)]),
    upper: f.optional(f.number([f.integer(), f.minValue(1)]))
  });

  const labels = {
    ...general.labels,
    ...team.labels,
    ...rankRange.labels
  };
  
  function cancel() {
    show = false;
  }
  
  $: teamCondition = ['teams', 'draft'].includes($general.value.type as any);
  $: rankRangeCondition = $general.value.openRank;
</script>

<form class="flex flex-col m-auto p-8 w-[450px] card shadow-md duration-150" transition:fly={{ duration: 150, y: 100 }}>
  <span class="inline-block font-medium text-2xl">Create Tournament</span>
  <div class="flex flex-col gap-4 my-8">
    <Text form={general} label={labels.name} legend="Tournament name" />
    <Text form={general} label={labels.acronym} legend="Tournament acronym" />
    <Text form={general} label={labels.urlSlug} legend="URL Slug">
      The string that will be used to navigate towards any pages related to the tournament.
      <svelte:fragment slot="preview">
        <strong>Example URL:</strong> {$page.url.origin}/{$general.value.urlSlug ? $general.value.urlSlug : '[slug]'}
      </svelte:fragment>
    </Text>
    <Select form={general} label={labels.type} legend="Tournament type" options={typeOptions} />
    {#if teamCondition}
      <div class="flex flex-col gap-4" transition:slide={{ duration: 150 }}>
        <Number form={team} label={labels.minTeamSize} legend="Min. team size" />
        <Number form={team} label={labels.maxTeamSize} legend="Max. team size" />
      </div>
    {/if}
    <Checkbox form={general} label={labels.openRank} legend="Is it open rank?" />
    {#if rankRangeCondition}
      <div class="flex flex-col gap-4" transition:slide={{ duration: 150 }}>
        <Number form={rankRange} label={labels.lower} legend="Lower rank range" />
        <Number form={rankRange} label={labels.upper} legend="Upper rank range">
          If not set, it'll default to infinity.
        </Number>
      </div>
    {/if}
  </div>
  <div class="flex gap-2">
    <button type="submit" class="btn variant-filled-primary" disabled={!(
      $general.canSubmit &&
      (teamCondition ? $team.canSubmit : true) &&
      (rankRangeCondition ? $rankRange.canSubmit : true)
    )}>Submit</button>
    <button type="button" class="btn variant-filled" on:click={cancel}>Cancel</button>
  </div>
</form>
