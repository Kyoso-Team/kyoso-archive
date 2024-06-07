<script lang="ts">
  import * as f from '$lib/form-validation';
  import { Form, Text, Select, DateOnly, DateTime, Section } from '$components/form';
  import { createForm } from '$stores';
  import { keys, sortByKey, toastError } from '$lib/utils';
  import { maxPossibleDate, oldestDatePossible } from '$lib/constants';
  import { tournamentOtherDateChecks } from '$lib/helpers';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import type { TournamentDates } from '$db';

  export let show: boolean;
  export let otherDatesHaveUpdated: boolean;
  export let otherDates: (typeof TournamentDates.$inferSelect)['other'];
  export let editIndex: number | undefined = undefined;
  const toast = getToastStore();
  const updating = editIndex !== undefined ? otherDates[editIndex] : undefined;
  const typeOptions: Record<'single' | 'range', string> = {
    single: 'Single date',
    range: 'Range of dates'
  };
  const displayOptions: Record<'date' | 'datetime', string> = {
    date: 'Date',
    datetime: 'Date and time'
  };
  const mainForm = createForm({
    label: f.string([f.minStrLength(2), f.maxStrLength(35)]),
    type: f.union(keys(typeOptions)),
    display: f.union(keys(displayOptions)),
    fromDate: f.date([f.minDate(oldestDatePossible), f.maxDate(maxPossibleDate)]),
    toDate: f.optional(f.date([f.minDate(oldestDatePossible), f.maxDate(maxPossibleDate)]))
  }, updating && {
    display: updating.onlyDate ? 'date' : 'datetime',
    label: updating.label,
    type: updating.toDate ? 'range' : 'single',
    fromDate: new Date(updating.fromDate),
    toDate: updating.toDate ? new Date(updating.toDate) : undefined
  });
  const labels = mainForm.labels;

  async function submit() {
    const { label, display, fromDate, toDate, type } = mainForm.getFinalValue($mainForm);

    const newDate: (typeof otherDates)[number] = {
      label,
      onlyDate: display === 'date',
      fromDate: fromDate.getTime(),
      toDate: toDate && type === 'range' ? toDate.getTime() : null
    };

    const err = tournamentOtherDateChecks(otherDates, newDate);

    if (err) {
      toastError(toast, err);
      return;
    }

    if (editIndex !== undefined) {
      otherDates[editIndex] = newDate;
    } else {
      otherDates.push(newDate);
    }

    otherDates = [...sortByKey(otherDates, 'fromDate', 'asc')];    
    show = false;
    otherDatesHaveUpdated = true;
    editIndex = undefined;
  }

  function cancel() {
    show = false;
    editIndex = undefined;
  }

  function onDisplayChange() {
    mainForm.setValue('fromDate', null);
    mainForm.setValue('toDate', null);
  }

  $: range = $mainForm.value.type === 'range';
  $: onlyDate = $mainForm.value.display === 'date';
</script>

<Form {submit}>
  <svelte:fragment slot="header">
    <span class="title">{editIndex ? 'Edit' : 'Add'} Date</span>
  </svelte:fragment>
  <Text form={mainForm} label={labels.label} legend="Date label">
    What is this date/are these dates for?
  </Text>
  <Select form={mainForm} label={labels.type} legend="Type" options={typeOptions} />
  <Select form={mainForm} label={labels.display} legend="Display" options={displayOptions} onChange={onDisplayChange} />
  {#if onlyDate}
    <DateOnly form={mainForm} label={labels.fromDate} legend={range ? 'From date' : 'Date'} />
  {:else}
    <DateTime form={mainForm} label={labels.fromDate} legend={range ? 'From date' : 'Date'} />
  {/if}
  {#if range}
    <Section>
      {#if onlyDate}
        <DateOnly form={mainForm} label={labels.toDate} legend="To date" />
      {:else}
        <DateTime form={mainForm} label={labels.toDate} legend="To date" />
      {/if}
    </Section>
  {/if}
  <svelte:fragment slot="actions">
    <button type="submit" class="btn variant-filled-primary" disabled={!(
      $mainForm.canSubmit &&
      (editIndex !== undefined ? $mainForm.hasUpdated : true)
    )}>Submit</button
    >
    <button type="button" class="btn variant-filled" on:click={cancel}>Cancel</button>
  </svelte:fragment>
</Form>
