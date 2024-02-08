<!-- <script lang="ts">
  import { form, paypal, error, sidebar, dashboardSidebar } from '$stores';
  import { Stepper, Step, ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
  import { format } from '$lib/utils';
  import { services } from '$lib/constants';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { SEO } from '$components';
  import { X } from 'lucide-svelte';
  import { onMount, onDestroy } from 'svelte';
  import type { PageServerData } from './$types';
  import type { TournamentFormData, TournamentType, TournamentService } from '$types';
  import type { PayPalButtonsComponent } from '@paypal/paypal-js';

  export let data: PageServerData;
  let createTournament: {
    showStepper: boolean;
    isFree: boolean;
    tournament?: TournamentFormData;
    services: TournamentService[];
  } = {
    services: [],
    showStepper: false,
    isFree: false
  };
  let selectedServices: TournamentService[] = [];
  let paypalBtnsContainer: HTMLElement | null = null;
  let btns: PayPalButtonsComponent | undefined;

  onMount(() => {
    dashboardSidebar.create(
      sidebar,
      data.tournamentsPlaying,
      data.tournamentsStaffing,
      showStepper
    );
  });

  onDestroy(() => {
    if ($dashboardSidebar) {
      dashboardSidebar.destroy(sidebar);
    }
  });

  function showStepper() {
    createTournament.showStepper = true;
    createTournament = { ...createTournament };
  }

  function hideStepper() {
    createTournament.showStepper = false;
    createTournament = { ...createTournament };
  }

  function onFillForm() {
    hideStepper();

    form.create<TournamentFormData>({
      title: 'Create Tournament',
      fields: ({ field, select }) => [
        field('Name', 'name', 'string', {
          validation: (z) => z.max(50)
        }),
        field('Acronym', 'acronym', 'string', {
          validation: (z) => z.max(8)
        }),
        field('Is it open rank?', 'isOpenRank', 'boolean'),
        field('Lower rank range limit', 'lowerRankRange', 'number', {
          validation: (z) => z.int().gte(1),
          disableIf: (tournament) => !!tournament.isOpenRank
        }),
        field('Upper rank range limit', 'upperRankRange', 'number', {
          validation: (z) => z.int().gte(1),
          disableIf: (tournament) => !!tournament.isOpenRank
        }),
        field('Type', 'type', 'string', {
          fromValues: {
            values: () => {
              let value = select<TournamentType>();

              return [value('teams'), value('solo')];
            }
          }
        }),
        field('Max. team size', 'teamSize', 'number', {
          validation: (z) => z.int().gte(1).lte(8),
          disableIf: (tournament) => tournament.type === 'solo'
        }),
        field('Players allowed to play per beatmap', 'teamPlaySize', 'number', {
          validation: (z) => z.int().gte(1).lte(8),
          disableIf: (tournament) => tournament.type === 'solo'
        }),
        field('Use BWS formula?', 'useBWS', 'boolean')
      ],
      onSubmit: (tournament) => {
        createTournament.tournament = tournament;
        showStepper();
      },
      onClose: showStepper,
      defaultValue: createTournament.tournament
    });
  }

  async function closeBtns() {
    await btns?.close();
  }

  async function onExit() {
    await closeBtns();
    hideStepper();

    createTournament.tournament = undefined;
    selectedServices = [];
    createTournament = { ...createTournament };
  }

  async function onComplete() {
    if (!createTournament.tournament) return;

    let tournament = await trpc($page).tournaments.createFreeTournament.mutate(
      mapTournament(createTournament.tournament, createTournament.services)
    );

    goto(`/tournament/${tournament.id}`);
  }

  function mapTournament(tournament: TournamentFormData, services: TournamentService[]) {
    return {
      ...tournament,
      services,
      rankRange: tournament.isOpenRank
        ? 'open rank'
        : ({
            lower: tournament.lowerRankRange || 1,
            upper: tournament.upperRankRange || 10000
          } as
            | 'open rank'
            | {
                lower: number;
                upper: number;
              }),
      teamPlaySize: tournament.teamPlaySize || 2,
      teamSize: tournament.teamSize || 3
    };
  }

  $: {
    createTournament.services = selectedServices;
    createTournament.isFree = data.user.freeServicesLeft - selectedServices.length >= 0;
    createTournament = { ...createTournament };
  }

  $: {
    if ($paypal?.Buttons && paypalBtnsContainer) {
      btns = $paypal.Buttons({
        createOrder: async () => {
          return await trpc($page).tournaments.checkoutNewTournament.mutate({
            services: createTournament.services,
            type: createTournament.tournament?.type
          });
        },
        onApprove: async ({ orderID }, actions) => {
          await actions.order?.capture();
          if (!createTournament.tournament) return;

          let created = await trpc($page).tournaments.createTournament.mutate({
            orderId: orderID,
            tournament: mapTournament(createTournament.tournament, createTournament.services)
          });

          goto(`/tournament/${created.id}`);
        },
        onError: (err) => {
          error.set($error, err, 'refresh');
        }
      });

      btns.render(paypalBtnsContainer);
    }
  }
</script>

<SEO page={$page} title="Dashboard - Kyoso" description="Privacy policy" noIndex />
{#if createTournament.showStepper}
  <div
    class="fixed inset-0 z-20 flex h-screen w-screen items-center justify-center p-4 bg-surface-backdrop-token"
  >
    <div class="card relative min-w-[19rem] p-6">
      <button
        on:click={onExit}
        class="btn variant-filled-primary absolute right-6 top-6 flex gap-1 px-3 py-1"
      >
        <X size={15} color="#000" /> Close
      </button>
      <Stepper
        active="variant-filled-secondary"
        buttonCompleteLabel="Create"
        regionHeader="w-[calc(100%-6.5rem)]"
        on:complete={onComplete}
      >
        <Step locked={!createTournament.tournament}>
          <svelte:fragment slot="header">Tournament Info</svelte:fragment>
          <p class="text-justify">
            Click the button below to input necessary information to create the tournament.
          </p>
          {#if createTournament.tournament}
            <div
              class="mx-auto flex w-72 flex-col-reverse rounded-[4px] bg-surface-900 p-4 sm:grid sm:w-[34rem] sm:grid-cols-[14.5rem_auto]"
            >
              <div class="flex flex-col text-sm">
                <div>
                  <b>Rank Range:</b>
                  {createTournament.tournament.isOpenRank
                    ? 'Open Rank'
                    : `${format.rank(
                        createTournament.tournament.lowerRankRange || 0
                      )} - ${format.rank(createTournament.tournament.upperRankRange || 0)}`}
                </div>
                <div>
                  <b>Format:</b>
                  {createTournament.tournament.type === 'solo'
                    ? '1v1'
                    : `${createTournament.tournament.teamPlaySize}v${createTournament.tournament.teamPlaySize} - Team Size ${createTournament.tournament.teamSize}`}
                </div>
                <div>
                  <b>BWS?:</b>
                  {createTournament.tournament.useBWS ? 'Yes' : 'No'}
                </div>
              </div>
              <header class="mb-2 block text-center sm:mb-0 sm:text-right">
                <h2>{createTournament.tournament.acronym}</h2>
                {createTournament.tournament.name}
              </header>
            </div>
          {/if}
          <button class="btn variant-filled-primary" on:click={onFillForm}>
            {createTournament.tournament ? 'Edit' : 'Fill'} Form
          </button>
        </Step>
        <Step locked={createTournament.services.length < 1}>
          <svelte:fragment slot="header">Services</svelte:fragment>
          <p class="text-justify">Select the services you'd like for your tournament.</p>
          <div class="rounded-[4px] bg-surface-900 p-2">
            <ListBox active="variant-filled-primary" multiple>
              {#each Object.keys(services) as service}
                <ListBoxItem
                  name="tournament-services"
                  value={service}
                  bind:group={selectedServices}
                >
                  <svelte:fragment slot="lead">
                    {service}
                  </svelte:fragment>
                  <svelte:fragment slot="trail">
                    {format.price(
                      services[service][
                        createTournament.tournament?.type === 'teams' ? 'teamsPrice' : 'soloPrice'
                      ]
                    )}
                  </svelte:fragment>
                </ListBoxItem>
              {/each}
            </ListBox>
          </div>
          <h4>
            Total Cost: {#if selectedServices.length && data.user.freeServicesLeft > 0}
              <s class="text-sm text-slate-300">
                {format.price(
                  selectedServices.reduce((total, service) => {
                    return (
                      total +
                      services[service][
                        createTournament.tournament?.type === 'teams' ? 'teamsPrice' : 'soloPrice'
                      ]
                    );
                  }, 0)
                )}
              </s>
            {/if}
            {format.price(
              selectedServices
                .map(
                  (service) =>
                    services[service][
                      createTournament.tournament?.type === 'teams' ? 'teamsPrice' : 'soloPrice'
                    ]
                )
                .sort((a, b) => b - a)
                .reduce((total, price, index) => {
                  if (data.user.freeServicesLeft > 0 && index === 1) {
                    total = 0;
                  }
                  return index < data.user.freeServicesLeft ? total : total + price;
                }, 0)
            )}
          </h4>
          {#if data.user.freeServicesLeft > 0}
            <span class="block max-w-xs text-justify text-sm"
              ><b>Note:</b> As a new user, you've been given the ability to add 3 services for free.{data
                .user.freeServicesLeft === 3
                ? ''
                : ` You currently have ${data.user.freeServicesLeft} service${
                    data.user.freeServicesLeft === 1 ? '' : 's'
                  } left.`}</span
            >
          {/if}
        </Step>
        <Step
          on:back={closeBtns}
          buttonComplete={createTournament.isFree ? 'variant-filled-primary' : 'hidden'}
        >
          <svelte:fragment slot="header">Checkout</svelte:fragment>
          {#if data.user.freeServicesLeft > 0}
            <p class="max-w-[19rem] text-justify">
              You're about to use {Math.min(
                createTournament.services.length,
                data.user.freeServicesLeft
              )} out of your {data.user.freeServicesLeft} free services left.
            </p>
          {/if}
          {#if createTournament.isFree}
            <p>You can create this tournament for free!</p>
          {:else}
            <div class="rounded-[4px] bg-surface-900 p-4 pb-0" bind:this={paypalBtnsContainer} />
          {/if}
        </Step>
      </Stepper>
    </div>
  </div>
{/if} -->
