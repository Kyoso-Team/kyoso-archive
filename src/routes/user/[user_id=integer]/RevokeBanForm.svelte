<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import { trpc } from '$lib/clients';
  import { Form, Text } from '$lib/components/form';
  import * as f from '$lib/form/validation';
  import { createForm, loading, toast } from '$lib/stores';

  export let show: boolean;
  export let banId: number;
  const form = createForm({
    revokeReason: f.pipe(f.string(), f.minStrLength(1))
  });
  const labels = form.labels;

  async function submit() {
    const { revokeReason } = form.getFinalValue($form);

    loading.set(true);
    await trpc($page)
      .users.revokeBan.mutate({
        banId,
        revokeReason
      })
      .catch(toast.errorCatcher);

    show = false;
    loading.set(false);
    toast.success('Revoked ban succcessfully');
    await invalidate('reload:user');
  }

  function cancel() {
    show = false;
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
