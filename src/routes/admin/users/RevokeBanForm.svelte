<script lang="ts">
  import * as f from '$lib/form/validation';
  import { trpc } from '$lib/clients';
  import { page } from '$app/stores';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { Form, Text } from '$lib/components/form';
  import { createForm, loading } from '$lib/stores';
  import { displayError, toastSuccess } from '$lib/utils';
  import { invalidate } from '$app/navigation';
  import type createContextStore from './store';

  export let ctx: ReturnType<typeof createContextStore>;
  const toast = getToastStore();
  const form = createForm({
    revokeReason: f.string([f.minStrLength(1)])
  });
  const labels = form.labels;

  async function submit() {
    const { revokeReason } = form.getFinalValue($form);

    if (!$ctx.banToRevoke) {
      throw Error('"banToRevoke" is undefined in the context');
    }

    loading.set(true);

    try {
      await trpc($page).users.revokeBan.mutate({
        banId: $ctx.banToRevoke.id,
        revokeReason
      });
    } catch (err) {
      displayError(toast, err);
    }

    ctx.toggleShowRevokeBanForm();
    loading.set(false);

    toastSuccess(toast, 'Ban revoked succcessfully');
    await invalidate($page.url.pathname);
  }

  function cancel() {
    ctx.toggleShowRevokeBanForm();
  }
</script>

<Form {submit}>
  <svelte:fragment slot="header">
    <span class="title">Revoke Ban</span>
  </svelte:fragment>
  <Text {form} label={labels.revokeReason} legend="Revoke Reason" long>
    Explain why this ban is being revoked for this user.
  </Text>
  <svelte:fragment slot="actions">
    <button type="submit" class="btn variant-filled-primary" disabled={!$form.canSubmit}
      >Submit</button
    >
    <button type="button" class="btn variant-filled" on:click={cancel}>Cancel</button>
  </svelte:fragment>
</Form>
