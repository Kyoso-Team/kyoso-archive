<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import { trpc } from '$lib/clients';
  import { Form, Text } from '$lib/components/form';
  import * as f from '$lib/form/validation';
  import { createForm, loading, toast } from '$lib/stores';
  import type createContextStore from './store';

  export let ctx: ReturnType<typeof createContextStore>;
  const form = createForm({
    revokeReason: f.pipe(f.string(), f.minStrLength(1))
  });
  const labels = form.labels;

  async function submit() {
    const { revokeReason } = form.getFinalValue($form);

    if (!$ctx.banToRevoke) {
      throw Error('"banToRevoke" is undefined in the context');
    }

    loading.set(true);
    await trpc($page)
      .users.revokeBan.mutate({
        banId: $ctx.banToRevoke.id,
        revokeReason
      })
      .catch(toast.errorCatcher);

    ctx.toggleShowRevokeBanForm();
    loading.set(false);

    toast.success('Ban revoked succcessfully');
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
