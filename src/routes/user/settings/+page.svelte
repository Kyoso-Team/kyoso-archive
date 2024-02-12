<!-- <script lang="ts">
  import { SEO } from '$components/general';
  import { SlideToggle, Table, getModalStore } from '@skeletonlabs/skeleton';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import type { PageServerData } from './$types';
    import { TRPCClientError } from '@trpc/client';

  export let data: PageServerData;
  let user = data.user;
  let modalStore = getModalStore();

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
<div class="m-8">

</div> -->
