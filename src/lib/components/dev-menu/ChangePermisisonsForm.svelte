<script lang="ts">
  import * as f from '$lib/form/validation';
  import { Checkbox, Form } from '$components/form';
  import { createForm, loading } from '$stores';
  import { displayError, toastSuccess } from '$lib/utils';
  import { invalidateAll } from '$app/navigation';
  import type { ToastStore } from '@skeletonlabs/skeleton';
  import type { AuthSession } from '$types';

  export let show: boolean;
  export let session: AuthSession;
  export let isUserOwner: boolean;
  export let toast: ToastStore;
  const mainForm = createForm(
    {
      owner: f.boolean(),
      admin: f.boolean(),
      approvedHost: f.boolean()
    },
    {
      owner: isUserOwner,
      admin: session.admin,
      approvedHost: session.approvedHost
    }
  );
  const labels = mainForm.labels;

  async function submit() {
    const value = mainForm.getFinalValue($mainForm);

    let resp!: Response;
    loading.set(true);

    try {
      resp = await fetch('/api/dev/change_permissions', {
        method: 'PATCH',
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
    toastSuccess(toast, 'Changed user permissions succcessfully');
  }

  function cancel() {
    show = false;
  }
</script>

<Form {submit}>
  <svelte:fragment slot="header">
    <span class="title">Change Permissions</span>
    <p class="mt-4">Set/Overwrite the permissions for the current user.</p>
  </svelte:fragment>
  <Checkbox form={mainForm} label={labels.owner} legend="Make user the website owner?" />
  <Checkbox form={mainForm} label={labels.admin} legend="Make user a website admin?" />
  <Checkbox form={mainForm} label={labels.approvedHost} legend="Make user an approved host?" />
  <svelte:fragment slot="actions">
    <button
      type="submit"
      class="btn variant-filled-primary"
      disabled={!($mainForm.canSubmit && $mainForm.hasUpdated)}>Submit</button
    >
    <button type="button" class="btn variant-filled" on:click={cancel}>Cancel</button>
  </svelte:fragment>
</Form>
