<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { Form, SelectMultiple } from '$lib/components/form';
  import { staffPermissionsOptions } from '$lib/form/common';
  import * as f from '$lib/form/validation';
  import { createForm, loading, toast } from '$lib/stores';
  import { keys } from '$lib/utils';
  import type { StaffPermission } from '$db';
  import type { InferEnum } from '$lib/types';

  export let show: boolean;
  export let tournament: { id: number };
  export let staffMember: { permissions: InferEnum<typeof StaffPermission>[] };
  const mainForm = createForm(
    {
      permissions: f.pipe(
        f.array(f.union(keys(staffPermissionsOptions))),
        f.minArrayLength(0),
        f.maxArrayLength(Object.keys(staffPermissionsOptions).length)
      )
    },
    {
      permissions: staffMember.permissions
    }
  );
  const labels = mainForm.labels;

  async function submit() {
    const { permissions } = mainForm.getFinalValue($mainForm);

    loading.set(true);
    const resp = await fetch('/api/dev/change_staff_permissions', {
      method: 'PATCH',
      body: JSON.stringify({
        permissions,
        tournamentId: tournament.id
      })
    }).catch(toast.errorCatcher);

    if (!resp.ok) {
      toast.error(await resp.text());
    }

    await invalidateAll();
    show = false;
    loading.set(false);
    toast.success('Changed staff permissions succcessfully');
  }

  function cancel() {
    show = false;
  }
</script>

<Form {submit}>
  <svelte:fragment slot="header">
    <span class="title">Change Permissions</span>
    <p class="mt-4">Set/Overwrite the permissions for the current staff member.</p>
  </svelte:fragment>
  <SelectMultiple
    form={mainForm}
    label={labels.permissions}
    legend="Staff permissions"
    options={staffPermissionsOptions}
  />
  <svelte:fragment slot="actions">
    <button
      type="submit"
      class="btn variant-filled-primary"
      disabled={!($mainForm.canSubmit && $mainForm.hasUpdated)}>Submit</button
    >
    <button type="button" class="btn variant-filled" on:click={cancel}>Cancel</button>
  </svelte:fragment>
</Form>
