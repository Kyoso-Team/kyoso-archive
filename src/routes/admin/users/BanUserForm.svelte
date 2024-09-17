<script lang="ts">
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import { trpc } from '$lib/clients';
  import { Checkbox, Form, Number, Section, Text } from '$lib/components/form';
  import * as f from '$lib/form/validation';
  import { createForm, loading } from '$lib/stores';
  import { displayError } from '$lib/ui';
  import { toastSuccess } from '$lib/utils';
  import type createContextStore from './store';

  export let ctx: ReturnType<typeof createContextStore>;

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

    if (!$ctx.issueBanTo) {
      throw Error('"issueBanTo" is undefined in the context');
    }

    loading.set(true);

    try {
      await trpc($page).users.banUser.mutate({
        banReason,
        issuedToUserId: $ctx.issueBanTo.id,
        banTime: timeValue?.timeAmount
      });
    } catch (err) {
      displayError(toast, err);
    }

    ctx.toggleShowBanUserForm();
    loading.set(false);

    toastSuccess(toast, 'Banned user succcessfully');
    await invalidate($page.url.pathname);
  }

  function cancel() {
    ctx.toggleShowBanUserForm();
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
      <Number form={timeForm} label={labels.timeAmount} legend="Amount of time banned" time>
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
