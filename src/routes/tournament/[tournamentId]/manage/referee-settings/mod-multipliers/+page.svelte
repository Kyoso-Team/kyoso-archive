<script lang="ts">
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { error, tournamentSidebar, form } from '$stores';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { colorByMod, modal } from '$lib/utils';
  import { SEO, Dropdown } from '$components';
  import type { Mod, ModMultiplier } from '$types';
  import type { PageServerData } from './$types';

  type MutateModMultiplier = {
    mods: Mod[];
    noMod: boolean;
    value: number;
  };

  export let data: PageServerData;

  onMount(() => {
    tournamentSidebar.setSelected('Settings', 'Referee', 'Mod Multipliers');
  });

  function mutateMultiplier(
    operation: 'create' | 'update',
    defaultValue?: MutateModMultiplier,
    multiplierId?: number
  ) {
    form.create<MutateModMultiplier>({
      defaultValue,
      title: `${operation === 'create' ? 'Create' : 'Update'} Multiplier`,
      fields: ({ field, select }) => [
        field('Multiplier value', 'value', 'number'),
        field('Applies to NoMod?', 'noMod', 'boolean'),
        field('Apply to mod or mod combination', 'mods', 'string', {
          fromValues: {
            values: () => {
              let value = select<Mod>();
              return [
                value('ez', 'Easy'),
                value('fl', 'Flaslight'),
                value('hd', 'Hidden'),
                value('hr', 'Hard Rock'),
                value('sd', 'Sudden Death'),
                value('pf', 'Perfect')
              ];
            },
            selectMultiple: {
              atLeast: 1
            }
          },
          disableIf: ({ noMod }) => !!noMod
        })
      ],
      onSubmit: async (multiplier) => {
        try {
          let areModsUnique = await trpc($page).validation.areModsUniqueInTournament.query({
            multiplierId,
            tournamentId: data.id,
            mods: multiplier.mods
          });

          if (!areModsUnique) {
            error.set(
              $error,
              `A mod multiplier for ${
                multiplier.mods.length === 0
                  ? 'NM'
                  : multiplier.mods.reduce((str, mod) => `${str}${mod}`, '')
              } already exists in this tournament.`,
              'close',
              false,
              () => {
                mutateMultiplier(operation, multiplier, multiplierId);
              }
            );

            return;
          }

          let input = {
            tournamentId: data.id,
            data: {
              mods: multiplier.noMod ? [] : multiplier.mods,
              value: multiplier.value
            }
          };

          if (operation === 'create') {
            await trpc($page).modMultipliers.createMultiplier.mutate(input);
          } else {
            if (!multiplierId) {
              throw new Error('"multiplierId" in update operation is undefined.');
            }

            await trpc($page).modMultipliers.updateMultiplier.mutate({
              ...input,
              where: {
                id: multiplierId
              }
            });
          }

          await invalidateAll();
        } catch (err) {
          console.error(err);
          error.set($error, err, 'close');
        }
      }
    });
  }

  function onCreateMultiplier() {
    mutateMultiplier('create');
  }

  function onUpdateMultiplier({ id, mods, value }: Omit<ModMultiplier, 'tournamentId'>) {
    mutateMultiplier(
      'update',
      {
        mods,
        value,
        noMod: mods.length === 0
      },
      id
    );
  }

  function onDeleteMultiplier({ id, mods }: Omit<ModMultiplier, 'tournamentId'>) {
    modal.yesNo(
      'Confirm Mod Multiplier Deletion',
      `Are you sure you want to delete the mod multiplier for ${
        mods.length === 0 ? 'NM' : mods.reduce((str, mod) => `${str}${mod}`, '')
      } from this tournament?`,
      async () => {
        try {
          await trpc($page).modMultipliers.deleteMultiplier.mutate({
            tournamentId: data.id,
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
    );
  }
</script>

<SEO
  page={$page}
  title={`Mod Multipliers - ${data.acronym}`}
  description={`Manage the mod multipliers for ${data.acronym} (${data.name})`}
  noIndex
/>
<div class="center-content">
  <h1>Mod Multipliers</h1>
  <p class="mt-4">Multipliers for mods applied to FreeMod maps.</p>
  <div class="my-4">
    <button class="btn variant-filled-primary" on:click={onCreateMultiplier}
      >Create Multiplier</button
    >
  </div>
  <div class="card mt-4 flex w-72 flex-col gap-2 p-4">
    {#if data.modMultipliers.length === 0}
      <p>No multipliers have been added</p>
    {:else}
      {#each data.modMultipliers as multiplier}
        <div
          class="relative flex justify-center gap-1 rounded-md px-4 py-2 bg-surface-backdrop-token"
        >
          {#if multiplier.mods.length === 0}
            <span class="badge variant-filled" style={`background-color: ${colorByMod('nm', 400)};`}
              >NM</span
            >
          {:else}
            {#each multiplier.mods as mod}
              <span
                class="badge variant-filled"
                style={`background-color: ${colorByMod(mod, 400)};`}>{mod}</span
              >
            {/each}
          {/if}
          <span>&#215;</span>
          <span>{multiplier.value.toString()}</span>
          <Dropdown
            name={`manage-multiplier-${multiplier.id}`}
            styles="absolute -top-[2px] right-2"
          >
            <button
              class="btn btn-sm variant-filled"
              on:click={() => onUpdateMultiplier(multiplier)}>Update</button
            >
            <button
              class="btn btn-sm variant-filled-error"
              on:click={() => onDeleteMultiplier(multiplier)}>Delete</button
            >
          </Dropdown>
        </div>
      {/each}
    {/if}
  </div>
</div>
