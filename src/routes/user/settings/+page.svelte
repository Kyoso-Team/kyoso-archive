<script lang="ts">
  import type { PageServerData } from './$types';
  import { SEO } from '$components';
  import { SlideToggle, Table, modalStore } from '@skeletonlabs/skeleton';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';

  export let data: PageServerData;
  let user = data.user;

  // Discord
  $: visibleDiscord = user.showDiscordTag;

  async function changeVisibility() {
    await trpc($page).users.changeDiscordVisibility.mutate(!visibleDiscord);
  }

  function confirmDiscordChange() {
    modalStore.trigger({
      type: 'confirm',
      title: 'Please confirm!',
      body: 'Do you really want to change which Discord account is linked to Kyoso?',
      response: async (r: boolean) => {
        if (r === true) {
          window.location.href = await trpc($page).auth.generateDiscordAuthLink.query();
        }
      }
    });
  }

  // Purchases
  let head_purchases = ['Purchase Date', 'Cost', 'Services', 'Tournament', 'PayPal Order ID'];
  let purchases = data.purchases.map((purch) => {
    return [
      purch.purchasedAt.toUTCString(),
      `US$${purch.cost}`,
      String(purch.services).replace(/,/g, ', '),
      purch.forTournament ? purch.forTournament.name : 'None',
      purch.payPalOrderId
    ].map((x) => String(x));
  });

  // API key
  let apiKeyInput: HTMLInputElement;
  let apiReveal: HTMLButtonElement;

  function revealApiKey() {
    apiKeyInput.classList.remove('hidden');
    apiReveal.classList.add('hidden');
  }

  function confirmKeyReset() {
    modalStore.trigger({
      type: 'confirm',
      title: 'Please confirm!',
      body: 'Do you really want to reset your Kyoso API key?',
      response: (r: boolean) => {
        if (r === true) {
          console.log('...reset the api key');
        }
      }
    });
  }
</script>

<SEO page={$page} title="Settings - Kyoso" description="User settings" noIndex />
<div class="m-8 rounded-lg bg-surface-800 p-4">
  <section class="mb-4 inline-grid">
    <h2 class="mb-2">Discord</h2>
    <p>Should your Discord tag be publicly visible?</p>
    <SlideToggle
      bind:checked={visibleDiscord}
      on:click={changeVisibility}
      name="toggleVisibility"
      active="bg-primary-500"
    >
      Your Discord tag is {visibleDiscord ? '' : 'NOT '}visible!
    </SlideToggle>
    <button on:click={confirmDiscordChange} class="variant-filled-error btn mt-4"
      >CHANGE DISCORD ACCOUNT</button
    >
  </section>
  <section class="mb-4">
    <h2 class="mb-2">Purchases</h2>
    {#if purchases.length}
      <p>Here are the purchases you have made so far:</p>
      <Table source={{ head: head_purchases, body: purchases }} color="variant-soft-tertiary" />
    {:else}
      <p>Your purchases will appear here!</p>
    {/if}
  </section>
  <section>
    <h2 class="mb-2">API key</h2>
    <p>The key below could help you with using Kyoso, make sure to never share it with anyone!</p>
    <input
      bind:this={apiKeyInput}
      type="text"
      class="input hidden w-auto"
      value={user.apiKey}
      readonly
    />
    <button bind:this={apiReveal} on:click={revealApiKey} class="btn variant-filled-primary"
      >Reveal key</button
    >
    <button on:click={confirmKeyReset} class="variant-filled-error btn">RESET KEY</button>
  </section>
</div>
