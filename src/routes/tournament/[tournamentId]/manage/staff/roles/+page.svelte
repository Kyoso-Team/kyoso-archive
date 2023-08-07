<script lang="ts">
  import isEqual from 'lodash.isequal';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { error, sidebar, form } from '$stores';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { modal, twColors } from '$lib/utils';
  import { SEO, Permission, CheckIcon, AdditionIcon, MoveUpIcon, MoveDownIcon } from '$components';
  import type { StaffPermission, StaffColor, StaffRole } from '@prisma/client';
  import type { PageServerData } from './$types';

  const allColors: StaffColor[] = [
    'Slate',
    'Gray',
    'Red',
    'Orange',
    'Yellow',
    'Lime',
    'Green',
    'Emerald',
    'Cyan',
    'Blue',
    'Indigo',
    'Purple',
    'Fuchsia',
    'Pink'
  ];
  const spanStyles = 'font-bold text-xl text-primary-500 block mt-8 mb-2';
  export let data: PageServerData;
  let roleNameError: string | undefined;
  let selectedIndex = 0;
  let selectedRole = data.roles[0] ? Object.assign({}, data.roles[0]) : undefined;
  let disabled = false;

  onMount(() => {
    sidebar.setSelected('Regs.', 'Staff', 'Roles');
  });

  function hasPerms(permissions: StaffPermission[], required: StaffPermission[]) {
    return permissions.some((perm) => required.includes(perm));
  }

  function onColorChange(color: StaffColor) {
    if (selectedRole) {
      selectedRole.color = color;
      selectedRole = Object.assign({}, selectedRole);
    }
  }

  async function onUpdateRole(role?: Omit<StaffRole, 'tournamentId'>) {
    if (!role) return;

    try {
      let isNameUnique = await trpc($page).validation.isStaffRoleNameUniqueInTournament.query({
        staffRoleId: role.id,
        name: role.name,
        tournamentId: data.tournament.id
      });

      if (!isNameUnique) {
        error.set(
          $error,
          `Staff role "${role.name}" already exists in this tournament.`,
          'close',
          false
        );

        return;
      }

      let { id, name, color, permissions } = role;

      await trpc($page).staffRoles.updateRole.mutate({
        tournamentId: data.tournament.id,
        data: {
          name,
          color,
          permissions
        },
        where: {
          id
        }
      });

      await invalidateAll();
    } catch (err) {
      console.error(err);
      error.set($error, err, 'close');
    }
  }

  function onDeleteMultiplier(role?: Omit<StaffRole, 'tournamentId'>) {
    if (!role) return;

    modal.yesNo(
      'Confirm Staff Role Deletion',
      `Are you sure you want to delete the "${role.name}" staff role from this tournament?`,
      async () => {
        try {
          await trpc($page).staffRoles.deleteRole.mutate({
            tournamentId: data.tournament.id,
            where: {
              id: role.id,
              order: role.order
            }
          });

          await invalidateAll();
          selectedIndex = Math.max(selectedIndex - 1, 0);
          selectedRole = data.roles[selectedIndex]
            ? Object.assign({}, data.roles[selectedIndex])
            : undefined;
        } catch (err) {
          console.error(err);
          error.set($error, err, 'close');
        }
      }
    );
  }

  async function onCreateRole(defaultValue?: { name: string }) {
    form.create<{
      name: string;
    }>({
      defaultValue,
      title: 'Create Staff Role',
      fields: ({ field }) => [
        field('Role name', 'name', 'string', {
          validation: (z) => z.max(25)
        })
      ],
      onSubmit: async ({ name }) => {
        try {
          let isNameUnique = await trpc($page).validation.isStaffRoleNameUniqueInTournament.query({
            name,
            tournamentId: data.tournament.id
          });

          if (!isNameUnique) {
            error.set(
              $error,
              `Staff role "${name}" already exists in this tournament.`,
              'close',
              false,
              () => {
                onCreateRole({ name });
              }
            );

            return;
          }

          await trpc($page).staffRoles.createRole.mutate({
            tournamentId: data.tournament.id,
            data: {
              name,
              color: 'Red'
            }
          });

          await invalidateAll();
          selectedIndex = data.roles.length - 1;
          selectedRole = Object.assign({}, data.roles[selectedIndex]);
        } catch (err) {
          console.error(err);
          error.set($error, err, 'close');
        }
      }
    });
  }

  async function onMoveRoleOrder(
    move: 'up' | 'down',
    role1?: Omit<StaffRole, 'tournamentId'>,
    role2?: Omit<StaffRole, 'tournamentId'>
  ) {
    if (!role1 || !role2) return;

    try {
      await trpc($page).staffRoles.swapOrder.mutate({
        tournamentId: data.tournament.id,
        role1: {
          id: role1.id,
          order: role1.order
        },
        role2: {
          id: role2.id,
          order: role2.order
        }
      });

      await invalidateAll();
      selectedIndex = move === 'up' ? selectedIndex - 1 : selectedIndex + 1;
      selectedRole = Object.assign({}, data.roles[selectedIndex]);
    } catch (err) {
      console.error(err);
      error.set($error, err, 'close');
    }
  }

  function onRoleChange(index: number, selectedRoleRef?: Omit<StaffRole, 'tournamentId'>) {
    if (!isEqual(data.roles[selectedIndex], selectedRoleRef)) {
      modal.yesNo(
        'Discard changes',
        'You have unsaved changes. Would you like to discard these changes?',
        () => {
          selectedIndex = index;
          selectedRole = Object.assign({}, data.roles[index]);
        }
      );
    } else {
      selectedIndex = index;
      selectedRole = Object.assign({}, data.roles[index]);
    }
  }
</script>

<SEO
  page={$page}
  title={`Staff Roles - ${data.tournament.acronym}`}
  description={`Manage the staff roles for ${data.tournament.acronym} (${data.tournament.name})`}
  noIndex
/>
<div class="center-content !py-0 !pl-4 !pr-1">
  <div class="flex w-full">
    <nav
      class={`mr-4 h-[calc(100vh-66px)] min-w-max overflow-y-auto overflow-x-hidden border-surface-500/50 pr-4 ${
        selectedRole ? 'border-r-0 sm:border-r' : ''
      }`}
    >
      <div class="flex flex-col gap-1 py-4">
        {#if data.roles.length > 1}
          <div class="mb-2 grid w-[9.75rem] grid-cols-[50%_50%] gap-1">
            <button
              class="variant-ringed-secondary btn btn-sm py-1"
              disabled={selectedIndex === 0}
              on:click={() => onMoveRoleOrder('up', selectedRole, data.roles[selectedIndex - 1])}
            >
              <MoveUpIcon w={20} h={20} />
            </button>
            <button
              class="variant-ringed-secondary btn btn-sm py-1"
              disabled={selectedIndex === data.roles.length - 1}
              on:click={() => onMoveRoleOrder('down', selectedRole, data.roles[selectedIndex + 1])}
            >
              <MoveDownIcon w={20} h={20} />
            </button>
          </div>
        {/if}
        {#each data.roles as role, i}
          <button
            class={`btn btn-sm w-40 justify-start ${
              i === selectedIndex ? 'variant-filled' : ''
            }`.trim()}
            on:click={() => onRoleChange(i, selectedRole)}
          >
            <span
              class="block h-3 min-h-[12px] w-3 min-w-[12px] rounded-full"
              style={`background-color: ${twColors[role.color.toLowerCase()][500]}`}
            />
            <span class="block overflow-hidden text-ellipsis">{role.name}</span>
          </button>
        {/each}
        <button
          class="btn btn-sm variant-filled-primary mt-2 w-40 justify-start"
          on:click={() => onCreateRole()}
        >
          <AdditionIcon w={12} h={12} />
          <span class="block overflow-hidden text-ellipsis">Create Role</span>
        </button>
      </div>
    </nav>
    {#if selectedRole}
      <div class="w-full">
        <div class="max-h-[calc(100vh-75px-66px)] overflow-y-auto py-4 pr-4">
          <div class="card mb-4 p-4">
            <div class="relative flex flex-wrap">
              <div class="w-60">
                <span>Role Name</span>
                <input
                  type="text"
                  class={`input ${roleNameError ? 'input-error' : ''}`}
                  {disabled}
                  bind:value={selectedRole.name}
                />
              </div>
              <div class="flex sm:absolute sm:right-0 sm:top-2">
                <div class="grid grid-cols-7 gap-1">
                  {#each allColors as color}
                    <button
                      class="btn h-6 w-6 rounded-md p-0"
                      style={`background-color: ${twColors[color.toLowerCase()][500]}`}
                      on:click={() => onColorChange(color)}
                    >
                      {#if color === selectedRole.color}
                        <CheckIcon w={18} h={18} />
                      {/if}
                    </button>
                  {/each}
                </div>
                <div
                  class="ml-2 h-[3.25rem] w-[3.25rem] rounded-md"
                  style={`background-color: ${twColors[selectedRole.color.toLowerCase()][500]}`}
                />
              </div>
            </div>
          </div>
          <div class="card px-6 py-4">
            <span class={spanStyles.replace('mt-8 ', '')}>Tournament</span>
            <Permission
              label="Administrate tournament"
              permissionName="MutateTournament"
              description="Allows the user to do anything the other roles do. In addition, the user is able to control the tournament's settings (dates, links, rules, manage stages, rounds prizes and graphics)."
              {disabled}
              noBorder
              bind:permissions={selectedRole.permissions}
            />
            <span class={spanStyles}>Staff Team</span>
            <Permission
              label="View Staff"
              permissionName="ViewStaffMembers"
              description="The user is able to view staff members and roles."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, [
                  'MutateTournament',
                  'MutateStaffMembers',
                  'DeleteStaffMembers'
                ])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Modify Staff"
              permissionName="MutateStaffMembers"
              description="The user is able to create, view and update staff members and roles."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, ['MutateTournament', 'DeleteStaffMembers'])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Manage Staff"
              permissionName="DeleteStaffMembers"
              description="The user is able to create, view, update and delete staff members and roles."
              disabled={disabled || hasPerms(selectedRole.permissions, ['MutateTournament'])}
              noBorder
              bind:permissions={selectedRole.permissions}
            />
            <span class={spanStyles}>Registrations</span>
            <Permission
              label="View Registrations"
              permissionName="ViewRegs"
              description="The user is able to view player registrations."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, [
                  'MutateTournament',
                  'MutateRegs',
                  'DeleteRegs'
                ])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Modify Registrations"
              permissionName="MutateRegs"
              description="The user is able to view and update player registrations."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, ['MutateTournament', 'DeleteRegs'])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Manage Registrations"
              permissionName="DeleteRegs"
              description="The user is able to view, update and delete player registrations."
              disabled={disabled || hasPerms(selectedRole.permissions, ['MutateTournament'])}
              noBorder
              bind:permissions={selectedRole.permissions}
            />
            <span class={spanStyles}>Mappool Structure</span>
            <Permission
              label="Modify Mappool Structure"
              permissionName="MutatePoolStructure"
              description="The user is able to view and update the mappool's structure for any round."
              disabled={disabled || hasPerms(selectedRole.permissions, ['MutateTournament'])}
              noBorder
              bind:permissions={selectedRole.permissions}
            />
            <span class={spanStyles}>Beatmap Pooling</span>
            <Permission
              label="View Pooled Beatmaps"
              permissionName="ViewPooledMaps"
              description="The user is able to view the mappool's beatmaps for any round."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, [
                  'MutateTournament',
                  'MutatePooledMaps',
                  'DeletePooledMaps',
                  'CanPlaytest'
                ])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Modify Pooled Beatmaps"
              permissionName="MutatePooledMaps"
              description="The user is able to create, view and update the mappool's beatmaps for any round."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, ['MutateTournament', 'DeletePooledMaps'])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Manage Pooled Beatmaps"
              permissionName="DeletePooledMaps"
              description="The user is able to create, view, update and delete the mappool's beatmaps for any round."
              disabled={disabled || hasPerms(selectedRole.permissions, ['MutateTournament'])}
              noBorder
              bind:permissions={selectedRole.permissions}
            />
            <span class={spanStyles}>Beatmap Suggestions</span>
            <Permission
              label="View Suggestions"
              permissionName="ViewPoolSuggestions"
              description="The user is able to view the mappool's beatmap suggestions for any round."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, [
                  'MutateTournament',
                  'MutatePoolSuggestions',
                  'DeletePoolSuggestions',
                  'ViewPooledMaps',
                  'MutatePooledMaps',
                  'DeletePooledMaps'
                ])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Modify Suggestions"
              permissionName="MutatePoolSuggestions"
              description="The user is able to create, view and update the mappool's beatmap suggestions for any round."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, ['MutateTournament', 'DeleteRegs'])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Manage Suggestions"
              permissionName="DeletePoolSuggestions"
              description="The user is able to create, view, update and delete the mappool's beatmap suggestions for any round."
              disabled={disabled || hasPerms(selectedRole.permissions, ['MutateTournament'])}
              noBorder
              bind:permissions={selectedRole.permissions}
            />
            <span class={spanStyles}>Playtesting</span>
            <Permission
              label="Provide Feedback & Replays"
              permissionName="CanPlaytest"
              description="The user is able to provide feedback and submit replays for a pooled beatmap."
              disabled={disabled || hasPerms(selectedRole.permissions, ['MutateTournament'])}
              noBorder
              bind:permissions={selectedRole.permissions}
            />
            <span class={spanStyles}>Matches</span>
            <Permission
              label="View Matches"
              permissionName="ViewMatches"
              description="The user is able to view the matches for any round."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, [
                  'MutateTournament',
                  'MutateMatches',
                  'DeleteMatches',
                  'RefMatches',
                  'CommentateMatches',
                  'StreamMatches'
                ])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Modify Matches"
              permissionName="MutateMatches"
              description="The user is able to create, view and update the matches for any round."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, ['MutateTournament', 'DeleteMatches'])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Manage Matches"
              permissionName="DeleteMatches"
              description="The user is able to create, view, update and delete the matches for any round."
              disabled={disabled || hasPerms(selectedRole.permissions, ['MutateTournament'])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Referee Matches"
              permissionName="RefMatches"
              description="The user is able to referee the matches for any round."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, [
                  'MutateTournament',
                  'MutateMatches',
                  'DeleteMatches'
                ])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Commentate Matches"
              permissionName="CommentateMatches"
              description="The user is able to commentate the matches for any round."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, [
                  'MutateTournament',
                  'MutateMatches',
                  'DeleteMatches'
                ])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Stream Matches"
              permissionName="StreamMatches"
              description="The user is able to commentate the matches for any round."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, [
                  'MutateTournament',
                  'MutateMatches',
                  'DeleteMatches'
                ])}
              noBorder
              bind:permissions={selectedRole.permissions}
            />
            <span class={spanStyles}>Statistics</span>
            <Permission
              label="View Stats."
              permissionName="ViewStats"
              description="The user is able to view the statistics for any round."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, [
                  'MutateTournament',
                  'MutateStats',
                  'DeleteStats'
                ])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Calculate Stats."
              permissionName="MutateStats"
              description="The user is able to view and calculate the statistics for any round."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, ['MutateTournament', 'DeleteStats'])}
              bind:permissions={selectedRole.permissions}
            />
            <Permission
              label="Manage Stats."
              permissionName="DeleteStats"
              description="The user is able to view, calculate and delete the statistics for any round."
              disabled={disabled || hasPerms(selectedRole.permissions, ['MutateTournament'])}
              noBorder
              bind:permissions={selectedRole.permissions}
            />
            <span class={spanStyles}>Other</span>
            <Permission
              label="Can Play"
              permissionName="CanPlay"
              description="The user is able to play in the tournament despite being a staff member."
              disabled={disabled ||
                hasPerms(selectedRole.permissions, [
                  'MutateTournament',
                  'MutateStaffMembers',
                  'DeleteStaffMembers',
                  'ViewRegs',
                  'MutateRegs',
                  'DeleteRegs',
                  'MutatePoolStructure',
                  'ViewPoolSuggestions',
                  'MutatePoolSuggestions',
                  'DeletePoolSuggestions',
                  'ViewPooledMaps',
                  'MutatePooledMaps',
                  'DeletePooledMaps',
                  'CanPlaytest',
                  'MutateMatches',
                  'DeleteMatches',
                  'MutateStats',
                  'DeleteStats'
                ])}
              noBorder
              bind:permissions={selectedRole.permissions}
            />
          </div>
        </div>
        <div
          class="relative -left-4 w-[calc(100%+1.5rem)] border-t-0 border-surface-500/50 sm:border-t"
        />
        <div class="flex justify-end gap-2 py-4 pr-4">
          <button
            class="btn variant-filled"
            disabled={isEqual(data.roles[selectedIndex], selectedRole)}
            on:click={() => onUpdateRole(selectedRole)}>Update</button
          >
          <button class="variant-filled-error btn" on:click={() => onDeleteMultiplier(selectedRole)}
            >Delete</button
          >
        </div>
      </div>
    {/if}
  </div>
</div>
