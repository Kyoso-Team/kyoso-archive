<script lang="ts">
  import * as f from '$lib/form-validation';
  import { trpc } from '$lib/clients';
  import { page } from '$app/stores';
  import { invalidate } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { Form, Section, Text, Number, Checkbox } from '$components/form';
  import { createForm, loading } from '$stores';
  import { displayError, toastSuccess } from '$lib/utils';

  export let show: boolean;
  export let issuedToUserId: number;
  const toast = getToastStore();
  const mainForm = createForm({
    banReason: f.string([f.minStrLength(1)]),
    permanent: f.boolean()
  });
  const timeForm = createForm({
    timeAmount: f.number([f.minValue(1), f.maxIntLimit()])
  });
  const labels = {
    ...mainForm.labels,
    ...timeForm.labels
  };

  async function submit() {
    const { banReason } = mainForm.getFinalValue($mainForm);
    const timeValue = !isPermanent ? timeForm.getFinalValue($timeForm) : undefined;

    loading.set(true);
    try {
      await trpc($page).users.banUser.mutate({
        banReason,
        issuedToUserId,
        banTime: timeValue?.timeAmount
      });
    } catch (err) {
      displayError(toast, err);
    }

    show = false;
    loading.set(false);
    toastSuccess(toast, 'Banned user succcessfully');
    await invalidate('reload:user');
  }

  function cancel() {
    show = false;
  }

  $: isPermanent = $mainForm.value.permanent;
</script>

<Form {submit}>
  <svelte:fragment slot="header">
    <span class="title">Ban User</span>
  </svelte:fragment>
  <Text form={mainForm} label={labels.banReason} legend="Reason" long>
    Explain why this user is being banned.
  </Text>
  <Checkbox form={mainForm} label={labels.permanent} legend="Permanent ban?" />
  {#if !isPermanent}
    <Section>
      <Number form={timeForm} label={labels.timeAmount} legend="Ban time" time>
        How long will this ban last?
      </Number>
    </Section>
  {/if}
  <svelte:fragment slot="actions">
    <button
      type="submit"
      class="btn variant-filled-primary"
      disabled={!($mainForm.canSubmit && (!isPermanent ? $timeForm.canSubmit : true))}
      >Submit</button
    >
    <button type="button" class="btn variant-filled" on:click={cancel}>Cancel</button>
  </svelte:fragment>
</Form>
