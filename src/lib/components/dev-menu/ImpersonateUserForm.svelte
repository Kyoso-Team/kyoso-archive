<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { Form, Number } from '$lib/components/form';
  import * as f from '$lib/form/validation';
  import { createForm, loading } from '$lib/stores';
  import { displayError, toastSuccess } from '$lib/utils';
  import type { ToastStore } from '@skeletonlabs/skeleton';
  import type { AuthSession } from '$lib/types';

  export let show: boolean;
  export let session: AuthSession;
  export let toast: ToastStore;
  const mainForm = createForm({
    userId: f.number([f.integer(), f.minValue(0), f.maxIntLimit()])
  });
  const labels = mainForm.labels;

  async function submit() {
    const value = mainForm.getFinalValue($mainForm);

    let resp!: Response;
    loading.set(true);

    try {
      resp = await fetch('/api/dev/impersonate', {
        method: 'PUT',
        body: JSON.stringify(value)
      });
    } catch (err) {
      displayError(toast, err);
    }

    if (!resp.ok) {
      displayError(toast, await resp.json());
    }

    await invalidateAll();
    show = false;
    loading.set(false);
    toastSuccess(toast, 'Impersonated user successfully');
  }

  function cancel() {
    show = false;
  }
</script>

<Form {submit}>
  <svelte:fragment slot="header">
    <span class="title">Impersonate User</span>
    {#if session.realUser}
      <p class="mt-4 text-warning-500">
        You're currently impersonating a user. Click "End Session" to go back to being yourself.
      </p>
    {/if}
  </svelte:fragment>
  <Number form={mainForm} label={labels.userId} legend="User ID"
    >The Kyoso user ID of the user you want to impersonate. Can be any user registered in the
    databse (except banned users).</Number
  >
  <svelte:fragment slot="actions">
    <button type="submit" class="btn variant-filled-primary" disabled={!$mainForm.canSubmit}
      >Submit</button
    >
    {#if session.realUser}
      <a
        class="btn variant-filled-error"
        href={`/api/auth/logout?redirect_uri=${encodeURI(
          `${$page.url.origin}/api/auth/login?redirect_uri=${encodeURI($page.url.toString())}`
        )}`}>End Session</a
      >
    {/if}
    <button type="button" class="btn variant-filled" on:click={cancel}>Cancel</button>
  </svelte:fragment>
</Form>
