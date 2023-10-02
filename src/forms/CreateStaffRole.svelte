<script lang="ts" context="module">
  import { z } from 'zod';
  import type { FormValue, FormSubmit } from '$types';

  const createStaffRoleSchemas = {
    name: z.string().max(45)
  };

  export type CreateStaffRoleValue = FormValue<typeof createStaffRoleSchemas>
  export type CreateStaffRoleCtx = {
    tournamentId: number;
  };
</script>
<script lang="ts">
  import { Form, Text } from '$components/form';
  import { FormError } from '$classes';

  let value: Partial<CreateStaffRoleValue> = {};

  const submit: FormSubmit<
    CreateStaffRoleValue,
    CreateStaffRoleCtx
  > = async (value, { ctx, trpc, page, invalidateAll }) => {
    let isNameUnique = await trpc(page).validation.isStaffRoleNameUniqueInTournament.query({
      name: value.name,
      tournamentId: ctx.tournamentId
    });

    if (!isNameUnique) {
      throw new FormError(`Staff role "${value.name}" already exists in this tournament.`);
    }

    await trpc(page).staffRoles.createRole.mutate({
      tournamentId: ctx.tournamentId,
      data: {
        name: value.name,
        color: 'red'
      }
    });

    await invalidateAll();
  };
</script>

<Form {value} {submit}>
  <svelte:fragment slot="header">
    <h2>Create Staff Role</h2>
  </svelte:fragment>
  <Text label="Role name" name="name" schema={createStaffRoleSchemas.name} bind:value={value.name} />
</Form>