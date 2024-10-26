<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import { trpc } from '$lib/clients';
  import { Checkbox, Form, Number, Section, Text } from '$lib/components/form';
  import * as f from '$lib/form/validation';
  import { createForm, loading, toast } from '$lib/stores';

  export let show: boolean;
  export let issuedToUserId: number;
  const mainForm = createForm({
    banReason: f.pipe(f.string(), f.minStrLength(1)),
    permanent: f.boolean()
  });
  const timeForm = createForm({
    timeAmount: f.pipe(f.number(), f.minValue(1), f.maxIntLimit())
  });
  const labels = {
    ...mainForm.labels,
    ...timeForm.labels
  };

  async function submit() {
    const { banReason } = mainForm.getFinalValue($mainForm);
    const timeValue = !isPermanent ? timeForm.getFinalValue($timeForm) : undefined;

    loading.set(true);
    await trpc($page)
      .users.banUser.mutate({
        banReason,
        issuedToUserId,
        banTime: timeValue?.timeAmount
      })
      .catch(toast.errorCatcher);

    await invalidate('reload:user');
    show = false;
    loading.set(false);
    toast.success('Banned user succcessfully');
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
