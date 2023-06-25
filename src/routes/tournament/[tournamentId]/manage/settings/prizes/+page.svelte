<script lang="ts">
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { error, sidebar, form } from '$stores';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { modal, format } from '$lib/utils';
  import { Prize, Dropdown } from '$components';
  import type { PageServerData } from './$types';
  import type { PrizeType, CashMetric } from '@prisma/client';

  type MutatePrize = {
    placements: number[];
    trophy: boolean;
    medal: boolean;
    badge: boolean;
    banner: boolean;
    items: string[];
    osuSupporter?: number;
    cash: boolean;
    cashValue?: number;
    cashPercentage?: number;
    cashCurrency?: string;
    cashMetric?: CashMetric;
  }

  export let data: PageServerData;

  let tournamentPrizes: typeof data.prizes = [];
  let pickemsPrizes: typeof data.prizes = [];

  onMount(() => {
    sidebar.setSelected('Settings', 'Settings', 'Prizes');
  });

  function mutatePrize(operation: 'create' | 'update', prizeType: PrizeType, defaultValue?: MutatePrize, prizeId?: number) {
    form.create<MutatePrize>({
      defaultValue,
      title: `${operation === 'create' ? 'Create' : 'Update'} ${prizeType === 'Pickems' ? 'Pickem' : 'Tournament'} Prize`,
      fields: ({ field, select }) => [
        field('For placements', 'placements', 'number', {
          list: true,
          validation: (z) => z.min(1)
        }),
        field('Includes a trophy?', 'trophy', 'boolean'),
        field('Includes a medal?', 'medal', 'boolean'),
        field('Includes a profile badge?', 'badge', 'boolean'),
        field('Includes a profile banner?', 'banner', 'boolean'),
        field('Months of osu! supporter', 'osuSupporter', 'number', {
          optional: true,
          validation: (z) => z.min(0)
        }),
        field('Includes cash?', 'cash', 'boolean'),
        field('Cash currency', 'cashCurrency', 'string', {
          validation: (z) => z.length(3),
          disableIf: ({ cash }) => !cash
        }),
        field('A fixed amount of cash or a percentage from a prize pool?', 'cashMetric', 'string', {
          fromValues: {
            values: () => {
              let value = select<CashMetric>();
              return [
                value('Fixed', 'Fixed'),
                value('Percent', 'Percentage')
              ];
            }
          },
          disableIf: ({ cash }) => !cash
        }),
        field('Amount of cash', 'cashValue', 'number', {
          validation: (z) => z.min(0),
          disableIf: ({ cash, cashMetric }) => !cash || cashMetric === 'Percent'
        }),
        field('Cash percentage', 'cashPercentage', 'number', {
          validation: (z) => z.min(0).max(100),
          disableIf: ({ cash, cashMetric }) => !cash || cashMetric === 'Fixed'
        }),
        field('Additional prizes', 'items', 'string', {
          optional: true,
          list: true,
          validation: (z) => z.max(25)
        })
      ],
      onSubmit: async (prize) => {
        try {
          let input = {
            data: {
              ... prize,
              type: prizeType,
              cash: prize.cash ? {
                currency: prize.cashCurrency || 'USD',
                value: (prize.cashMetric === 'Fixed' ? prize.cashValue : prize.cashPercentage) || 0,
                metric: prize.cashMetric || 'Fixed'
              } : undefined
            },
            tournamentId: data.id
          };

          if (operation === 'create') {
            await trpc($page).prizes.createPrize.mutate(input);
          } else {
            if (!prizeId) {
              throw new Error('"prizeId" in update operation is undefined.');
            }

            await trpc($page).prizes.updatePrize.mutate({
              ... input,
              where: {
                id: prizeId
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

  function transformPrize({ badge, banner, cash, items, medal, osuSupporter, placements, trophy }: typeof data.prizes[number]) {
    return {
      badge,
      banner,
      items,
      medal,
      osuSupporter,
      placements,
      trophy,
      cash: !!cash,
      cashCurrency: cash?.currency,
      cashMetric: cash?.metric,
      cashValue: cash?.metric === 'Fixed' ? cash?.value : undefined,
      cashPercentage: cash?.metric === 'Percent' ? cash?.value : undefined
    };
  }

  function onCreateTournamentPrize() {
    mutatePrize('create', 'Tournament');
  }

  function onCreatePickemsPrize() {
    mutatePrize('create', 'Pickems');
  }

  function onUpdatePrize(prize: typeof data.prizes[number]) {
    mutatePrize('update', prize.type, transformPrize(prize), prize.id);
  }

  function onDeletePrize(prize: typeof data.prizes[number]) {
    modal.yesNo(
      'Confirm Prize Deletion',
      `Are you sure you want to delete the ${format.placements(prize.placements)} place ${prize.type === 'Pickems' ? 'pickems' : ''} prize from this tournament?`,
      async () => {
        try {
          await trpc($page).prizes.deletePrize.mutate({
            tournamentId: data.id,
            where: {
              id: prize.id
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

  $: {
    tournamentPrizes = data.prizes.filter(({ type }) => type === 'Tournament');
    pickemsPrizes = data.prizes.filter(({ type }) => type === 'Pickems');
  }
</script>

<div class="center-content">
  <h1>Prizes</h1>
  <h2 class="pt-8">Tournament Prizes</h2>
  <p class="pt-4">Prizes to be awarded to the winning players of the tournament</p>
  <div class="my-4">
    <button
      class="btn variant-filled-primary"
      on:click={onCreateTournamentPrize}>Create Prize</button
    >
  </div>
  <div class="flex flex-col flex-wrap justify-center gap-4">
    {#if tournamentPrizes.length === 0}
      <p>No tournament prizes have been created</p>
    {:else}
      {#each tournamentPrizes as prize}
        <Prize {prize}>
          <svelte:fragment slot="menu">
            <Dropdown name={`manage-prize-${prize.id}`} styles="absolute top-0 right-2">
              <button class="btn btn-sm variant-filled" on:click={() => onUpdatePrize(prize)}>Update</button>
              <button class="btn btn-sm variant-filled-error" on:click={() => onDeletePrize(prize)}>Delete</button>
            </Dropdown>
          </svelte:fragment>
        </Prize>
      {/each}
    {/if}
  </div>
  {#if data.services.includes('Pickems')}
    <h2 class="pt-8">Pickems Prizes</h2>
    <p class="pt-4">Prizes to be awarded to the winning users of the tournament's pickems</p>
    <div class="my-4">
      <button
        class="btn variant-filled-primary"
        on:click={onCreatePickemsPrize}>Create Prize</button
      >
    </div>
    <div class="flex flex-col flex-wrap justify-center gap-4">
      {#if tournamentPrizes.length === 0}
        <p>No pickems prizes have been created</p>
      {:else}
        {#each pickemsPrizes as prize}
          <Prize {prize}>
            <svelte:fragment slot="menu">
              <Dropdown name={`manage-prize-${prize.id}`} styles="absolute top-0 right-2">
                <button class="btn btn-sm variant-filled" on:click={() => onUpdatePrize(prize)}>Update</button>
                <button class="btn btn-sm variant-filled-error" on:click={() => onDeletePrize(prize)}>Delete</button>
              </Dropdown>
            </svelte:fragment>
          </Prize>
        {/each}
      {/if}
    </div>
  {/if}
</div>