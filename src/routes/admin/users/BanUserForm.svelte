<script lang="ts">
  import * as f from '$lib/form-validation';
  import { trpc } from '$lib/trpc';
  import { page } from '$app/stores';
  import { invalidate } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { Form, Section, Text, Number, Checkbox } from '$components/form';
  import { createForm, loading } from '$stores';
  import { displayError, toastSuccess } from '$lib/utils';
  import type createContextStore from './store';

  export let ctx: ReturnType<typeof createContextStore>;

  const toast = getToastStore();

  const main = createForm({
    banReason: f.string([f.minStrLength(1)]),
    permanent: f.boolean()
  });

  const time = createForm({
    timeAmount: f.number([f.minValue(1), f.maxSafeInt()])
  });

  const labels = {
    ...main.labels,
    ...time.labels
  };

  async function submit() {
    const { banReason } = main.getFinalValue($main);
    const timeValue = timeCondition ? time.getFinalValue($time) : undefined;

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

  $: timeCondition = !$main.value.permanent;
</script>

<Form {submit}>
  <svelte:fragment slot="header">
    <span class="title">Ban User</span>
  </svelte:fragment>
  <Text form={main} label={labels.banReason} legend="Reason" long>
    Explain why this user is being banned.
  </Text>
  <Checkbox form={main} label={labels.permanent} legend="Permanent ban?" />
  {#if timeCondition}
    <Section>
      <Number form={time} label={labels.timeAmount} legend="Amount of time banned" time>
        How long will this ban last?
      </Number>
    </Section>
  {/if}
  <svelte:fragment slot="actions">
    <button
      type="submit"
      class="btn variant-filled-primary"
      disabled={!($main.canSubmit && (timeCondition ? $time.canSubmit : true))}>Submit</button
    >
    <button type="button" class="btn variant-filled" on:click={cancel}>Cancel</button>
  </svelte:fragment>
</Form>
