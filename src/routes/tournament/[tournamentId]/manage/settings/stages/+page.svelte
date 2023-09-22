<script lang="ts">
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { error, tournamentSidebar, legacyForm } from '$stores';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { modal } from '$lib/utils';
  import { SEO } from '$components';
  import { ChevronDown, ChevronUp } from 'lucide-svelte';
  import type { StageFormat, QualifierRunsSummary } from '$types';
  import type { PageServerData } from './$types';

  type BattleRoyaleDefault = {
    name: string;
    playersEliminatedPerMap: number;
  };
  type QualifierDefault = {
    name: string;
    runCount: number;
    summarizeRunsAs?: QualifierRunsSummary;
  };
  type StandardDefault = {
    name: string;
    bestOf: number;
    banCount: number;
    protectCount: number;
  };

  export let data: PageServerData;

  onMount(() => {
    tournamentSidebar.setSelected('Settings', 'Settings', 'Stages');
  });

  function mapReadableFormat(format: StageFormat) {
    switch (format) {
      case 'battle_royale':
        return 'Battle Royale';
      case 'double_elim':
        return 'Double Elimination Bracket';
      case 'single_elim':
        return 'Single Elimination Bracket';
      case 'swiss':
        return 'Swiss Bracket';
      default:
        return format;
    }
  }

  function onCreateStage() {
    legacyForm.create<{
      format: StageFormat;
    }>({
      title: 'Create Stage',
      fields: ({ field, select }) => [
        field('Format', 'format', 'string', {
          fromValues: {
            values: () => {
              let value = select<StageFormat>();
              let formats = [
                value('groups', 'Groups'),
                value('qualifiers', 'Qualifiers'),
                value('swiss', 'Swiss'),
                value('single_elim', 'Single Elimination'),
                value('double_elim', 'Double Elimination'),
                value('battle_royale', 'Battle Royale')
              ];

              return formats.filter((format) => {
                return !data.stages.some((stage) => format.value === stage.format);
              });
            }
          }
        })
      ],
      onSubmit: async ({ format }) => {
        try {
          await trpc($page).stages.createStage.mutate({
            tournamentId: data.id,
            data: {
              format
            }
          });

          await invalidateAll();
        } catch (err) {
          console.error(err);
          error.set($error, err, 'close');
        }
      }
    });
  }

  async function onMakeMain(stageId: number) {
    try {
      await trpc($page).stages.makeMain.mutate({
        stageId,
        tournamentId: data.id
      });

      await invalidateAll();
    } catch (err) {
      console.error(err);
      error.set($error, err, 'close');
    }
  }

  async function onMoveStageOrder(
    stage1Id: number,
    stage1Order: number,
    stage2Id: number,
    stage2Order: number
  ) {
    try {
      await trpc($page).stages.swapOrder.mutate({
        tournamentId: data.id,
        stage1: {
          id: stage1Id,
          order: stage1Order
        },
        stage2: {
          id: stage2Id,
          order: stage2Order
        }
      });

      await invalidateAll();
    } catch (err) {
      console.error(err);
      error.set($error, err, 'close');
    }
  }

  function onDeleteStage(
    stage: {
      id: number;
      order: number;
    },
    format: StageFormat
  ) {
    modal.yesNo(
      'Confirm Stage Deletion',
      `Are you sure you want to delete the ${mapReadableFormat(
        format
      ).toLowerCase()} stage from this tournament? This will delete all of its created rounds and therefore, their mappools, schedules, statistics, etc.`,
      async () => {
        try {
          await trpc($page).stages.deleteStage.mutate({
            tournamentId: data.id,
            where: stage
          });

          await invalidateAll();
        } catch (err) {
          console.error(err);
          error.set($error, err, 'close');
        }
      }
    );
  }

  async function createRound(stageId: number, format: StageFormat) {
    if (format === 'battle_royale') {
      mutateBattleRoyaleRound(stageId, 'create');
    } else if (format === 'qualifiers') {
      mutateQualifierRound(stageId, 'create');
    } else {
      mutateStandardRound(stageId, 'create');
    }
  }

  async function updateRound(
    stageFormat: StageFormat,
    roundId: number,
    defaultValue: Record<string, unknown> | undefined
  ) {
    if (stageFormat === 'battle_royale') {
      mutateBattleRoyaleRound(0, 'update', defaultValue as BattleRoyaleDefault, roundId);
    } else if (stageFormat === 'qualifiers') {
      mutateQualifierRound(0, 'update', defaultValue as QualifierDefault, roundId);
    } else {
      mutateStandardRound(0, 'update', defaultValue as StandardDefault, roundId);
    }
  }

  function mutateBattleRoyaleRound(
    stageId: number,
    operation: 'create' | 'update',
    defaultValue?: BattleRoyaleDefault,
    roundId?: number
  ) {
    legacyForm.create<BattleRoyaleDefault>({
      defaultValue,
      title: `${operation[0].toUpperCase()}${operation.substring(1)} Round`,
      fields: ({ field }) => [
        field('Name', 'name', 'string', {
          validation: (z) => z.max(20)
        }),
        field('Players eliminated per map', 'playersEliminatedPerMap', 'number', {
          validation: (z) => z.int().gte(1)
        })
      ],
      onSubmit: async (round) => {
        try {
          let isRoundNameUnique = await trpc($page).validation.isRoundNameUniqueInTournament.query({
            name: round.name,
            tournamentId: data.id,
            roundId
          });

          if (!isRoundNameUnique) {
            error.set(
              $error,
              `${round.name} already exists in this tournament.`,
              'close',
              false,
              () => {
                mutateBattleRoyaleRound(stageId, operation, round, roundId);
              }
            );

            return;
          }

          let input = {
            tournamentId: data.id,
            data: {
              ...round,
              stageId
            }
          };

          if (operation === 'create') {
            await trpc($page).rounds.createBattleRoyaleRound.mutate(input);
          } else {
            if (!roundId) {
              throw new Error('"roundId" in update operation is undefined');
            }

            await trpc($page).rounds.updateBattleRoyaleRound.mutate({
              ...input,
              where: {
                id: roundId
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

  function mutateQualifierRound(
    stageId: number,
    operation: 'create' | 'update',
    defaultValue?: QualifierDefault,
    roundId?: number
  ) {
    legacyForm.create<QualifierDefault>({
      defaultValue,
      title: `${operation[0].toUpperCase()}${operation.substring(1)} Round`,
      fields: ({ field, select }) => [
        field('Name', 'name', 'string', {
          validation: (z) => z.max(20)
        }),
        field('Number of runs', 'runCount', 'number', {
          validation: (z) => z.int().gte(1)
        }),
        field('Summarize runs by', 'summarizeRunsAs', 'string', {
          optional: true,
          fromValues: {
            values: () => {
              let value = select<QualifierRunsSummary>();
              let runs = [
                value('average', 'Average of scores'),
                value('sum', 'Sum of scores'),
                value('best', 'Best score between runs')
              ];

              return runs;
            }
          },
          disableIf: ({ runCount }) => !runCount || runCount <= 1
        })
      ],
      onSubmit: async (round) => {
        try {
          let isRoundNameUnique = await trpc($page).validation.isRoundNameUniqueInTournament.query({
            name: round.name,
            tournamentId: data.id,
            roundId
          });

          if (!isRoundNameUnique) {
            error.set(
              $error,
              `${round.name} already exists in this tournament.`,
              'close',
              false,
              () => {
                mutateQualifierRound(stageId, operation, round, roundId);
              }
            );

            return;
          }

          let input = {
            tournamentId: data.id,
            data: {
              ...round,
              stageId
            }
          };

          if (operation === 'create') {
            await trpc($page).rounds.createQualifierRound.mutate(input);
          } else {
            if (!roundId) {
              throw new Error('"roundId" in update operation is undefined.');
            }

            await trpc($page).rounds.updateQualifierRound.mutate({
              ...input,
              where: {
                id: roundId
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

  function mutateStandardRound(
    stageId: number,
    operation: 'create' | 'update',
    defaultValue?: StandardDefault,
    roundId?: number
  ) {
    legacyForm.create<StandardDefault>({
      defaultValue,
      title: `${operation[0].toUpperCase()}${operation.substring(1)} Round`,
      fields: ({ field }) => [
        field('Name', 'name', 'string', {
          validation: (z) => z.max(20)
        }),
        field('Best of', 'bestOf', 'number', {
          validation: (z) =>
            z
              .int()
              .gte(1)
              .refine((n: number) => n % 2 !== 0, 'Input must be odd')
        }),
        field('Number of bans', 'banCount', 'number', {
          validation: (z) => z.int().gte(0)
        }),
        field('Number of protects', 'protectCount', 'number', {
          validation: (z) => z.int().gte(0)
        })
      ],
      onSubmit: async (round) => {
        try {
          let isRoundNameUnique = await trpc($page).validation.isRoundNameUniqueInTournament.query({
            name: round.name,
            tournamentId: data.id,
            roundId
          });

          if (!isRoundNameUnique) {
            error.set(
              $error,
              `${round.name} already exists in this tournament.`,
              'close',
              false,
              () => {
                mutateStandardRound(stageId, operation, round, roundId);
              }
            );

            return;
          }

          let input = {
            tournamentId: data.id,
            data: {
              ...round,
              stageId
            }
          };

          if (operation === 'create') {
            await trpc($page).rounds.createStandardRound.mutate(input);
          } else {
            if (!roundId) {
              throw new Error('"roundId" in update operation is undefined');
            }

            await trpc($page).rounds.updateStandardRound.mutate({
              ...input,
              where: {
                id: roundId
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

  async function onMoveRoundOrder(
    round1Id: number,
    round1Order: number,
    round2Id: number,
    round2Order: number
  ) {
    try {
      await trpc($page).rounds.swapOrder.mutate({
        tournamentId: data.id,
        round1: {
          id: round1Id,
          order: round1Order
        },
        round2: {
          id: round2Id,
          order: round2Order
        }
      });

      await invalidateAll();
    } catch (err) {
      console.error(err);
      error.set($error, err, 'close');
    }
  }

  function onDeleteRound(
    round: {
      id: number;
      name: string;
      order: number;
    },
    stageId: number
  ) {
    modal.yesNo(
      'Confirm Round Deletion',
      `Are you sure you want to delete the "${round.name}" round from this tournament? This will delete its mappools, schedules, statistics, etc.`,
      async () => {
        try {
          await trpc($page).rounds.deleteRound.mutate({
            tournamentId: data.id,
            where: {
              stageId,
              id: round.id,
              order: round.order
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
  title={`Stages - ${data.acronym}`}
  description={`Manage the stages for ${data.acronym} (${data.name})`}
  noIndex
/>
<div class="center-content">
  <h1>Stages</h1>
  <div class="my-4">
    <button
      class="btn variant-filled-primary"
      disabled={data.stages.length === 5}
      on:click={onCreateStage}>Create Stage</button
    >
  </div>
  <div class="flex flex-col flex-wrap justify-center gap-4">
    {#if data.stages.length === 0}
      <p>No stages have been created</p>
    {:else}
      {#each data.stages as { rounds, format, isMainStage, order, id }, i}
        <div class="card relative w-80 p-4 sm:w-[32rem]">
          <div class="flex items-center">
            <span class="text-xl font-bold">
              {mapReadableFormat(format)}
            </span>
            {#if isMainStage}
              <span class="badge variant-filled-primary ml-2">Main Stage</span>
            {/if}
          </div>
          <div class="absolute right-4 top-4 flex gap-x-2">
            {#if i !== 0}
              <button
                class="btn btn-sm variant-ringed-primary p-1"
                on:click={() =>
                  onMoveStageOrder(id, order, data.stages[i - 1].id, data.stages[i - 1].order)}
              >
                <ChevronUp size={20} />
              </button>
            {/if}
            {#if i !== data.stages.length - 1}
              <button
                class="btn btn-sm variant-ringed-primary p-1"
                on:click={() =>
                  onMoveStageOrder(id, order, data.stages[i + 1].id, data.stages[i + 1].order)}
              >
                <ChevronDown size={20} />
              </button>
            {/if}
            {#if !isMainStage}
              <button class="btn btn-sm variant-ringed-primary" on:click={() => onMakeMain(id)}
                >Make Main</button
              >
            {/if}
          </div>
          <div
            class={`card mt-4 bg-surface-backdrop-token ${
              rounds.length === 0 ? '' : 'flex flex-col flex-wrap px-4 py-2'
            }`}
          >
            {#if rounds.length === 0}
              <p class="py-4 text-center">No rounds have been created</p>
            {:else}
              {#each rounds as round, j}
                <div
                  class={`relative flex flex-wrap py-2 items-center${
                    j === rounds.length - 1 ? '' : ' border-b border-surface-500/50'
                  }`}
                >
                  <div class="w-full">
                    <span class="pr-6 text-xl font-bold">{round.name}</span>
                    {#if round.battleRoyaleRound}
                      <span class="badge variant-filled">
                        {round.battleRoyaleRound.playersEliminatedPerMap} Elim. / Map
                      </span>
                    {:else if round.qualifierRound}
                      <span class="badge variant-filled mr-1">
                        {round.qualifierRound.runCount}
                        Run{round.qualifierRound.runCount > 1 ? 's' : ''}
                      </span>
                      {#if round.qualifierRound.runCount > 1}
                        <span class="badge variant-filled">
                          Summarize by {round.qualifierRound.summarizeRunsAs.toLowerCase()}
                        </span>
                      {/if}
                    {:else if round.standardRound}
                      <span class="badge variant-filled">
                        Best of {round.standardRound.bestOf}
                      </span>
                      <span class="badge variant-filled mx-1">
                        {round.standardRound.banCount > 0 ? round.standardRound.banCount : 'No'}
                        {round.standardRound.banCount > 0 ? 'B' : 'b'}an{round.standardRound
                          .banCount === 1
                          ? ''
                          : 's'}
                      </span>
                      <span class="badge variant-filled mx-1">
                        {round.standardRound.protectCount > 0
                          ? round.standardRound.protectCount
                          : 'No'}
                        {round.standardRound.protectCount > 0 ? 'P' : 'p'}rotect{round.standardRound
                          .protectCount === 1
                          ? ''
                          : 's'}
                      </span>
                    {/if}
                  </div>
                  <div class="absolute right-2 top-2 flex gap-x-2">
                    {#if j !== 0}
                      <button
                        class="btn btn-sm variant-ringed-secondary p-1"
                        on:click={() =>
                          onMoveRoundOrder(
                            round.id,
                            round.order,
                            rounds[j - 1].id,
                            rounds[j - 1].order
                          )}
                      >
                        <ChevronUp size={20} />
                      </button>
                    {/if}
                    {#if j !== rounds.length - 1}
                      <button
                        class="btn btn-sm variant-ringed-secondary p-1"
                        on:click={() =>
                          onMoveRoundOrder(
                            round.id,
                            round.order,
                            rounds[j + 1].id,
                            rounds[j + 1].order
                          )}
                      >
                        <ChevronUp size={20} />
                      </button>
                    {/if}
                  </div>
                  <div class="mt-2 flex gap-x-2">
                    <button
                      class="btn btn-sm variant-filled-secondary"
                      on:click={() =>
                        updateRound(format, round.id, {
                          name: round.name,
                          ...round.standardRound,
                          ...round.qualifierRound,
                          ...round.battleRoyaleRound
                        })}>Update Round</button
                    >
                    <button
                      class="btn btn-sm variant-filled-error"
                      on:click={() => onDeleteRound(round, id)}>Delete Round</button
                    >
                  </div>
                </div>
              {/each}
            {/if}
          </div>
          <div class="mt-4 grid grid-cols-[50%_50%]">
            <div>
              <button
                class="btn btn-sm variant-filled-primary"
                on:click={() => createRound(id, format)}>Create Round</button
              >
            </div>
            <div class="flex justify-end">
              <button
                class="btn btn-sm variant-filled-error"
                on:click={() =>
                  onDeleteStage(
                    {
                      id,
                      order
                    },
                    format
                  )}>Delete Stage</button
              >
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
