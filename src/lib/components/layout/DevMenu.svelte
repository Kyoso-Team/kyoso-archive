<script lang="ts">
  import { ImpersonateUserForm, ChangePermisisonsForm } from '$components/dev-menu';
  import { browser } from '$app/environment';
  import { loading } from '$stores';
  import { fade } from 'svelte/transition';
  import { Backdrop } from '$components/layout';
  import { onDestroy, onMount } from 'svelte';
  import { getToastStore, modeCurrent, setModeCurrent, setModeUserPrefers } from '@skeletonlabs/skeleton';
  import { toastError } from '$lib/utils';
  import type { AuthSession } from '$types';

  export let session: AuthSession | undefined;
  export let isUserOwner: boolean;
  let show = true;
  let showImpersonateUserForm = false;
  let showChangePermissionsForm = false;
  const toast = getToastStore();
  const generalCommands: Record<string, string> = {
    '1': 'Toggle this menu',
    '2': 'Toggle between dark and light theme',
    '3': 'Impersonate user',
    '4': 'Update user permissions',
    '5': 'Set tournament dates',
    '6': 'Set staff permissions'
  };

  onMount(() => {
    if (!browser) return;
    window.addEventListener('keydown', onDevShortcut);
  });

  onDestroy(() => {
    if (!browser) return;
    window.removeEventListener('keydown', onDevShortcut);
  });

  function onDevShortcut(e: KeyboardEvent) {
    if (!e.ctrlKey || !e.shiftKey) return;

    switch (e.key) {
      case '!':
        toggleShow();
        break;
      case '@':
        toggletheme();
        break;
      case '#':
        toggleShowImpersonateUserModal();
        break;
      case '$':
        toggleShowChangePermissionsModal();
        break;
      default:
        break;
    }
  }

  function toggleShow() {
    show = !show;
  }

  function toggleShowImpersonateUserModal() {
    if ($loading || showChangePermissionsForm) return;

    if (!session) {
      toastError(toast, 'Log in to execute this command');
      return;
    }

    showImpersonateUserForm = !showImpersonateUserForm;
  }

  function toggleShowChangePermissionsModal() {
    if ($loading || showImpersonateUserForm) return;

    if (!session) {
      toastError(toast, 'Log in to execute this command');
      return;
    }

    showChangePermissionsForm = !showChangePermissionsForm;
  }

  function toggletheme() {
    $modeCurrent = !$modeCurrent;
    setModeUserPrefers($modeCurrent);
    setModeCurrent($modeCurrent);
  }
</script>

{#if showImpersonateUserForm && session}
  <Backdrop zIndex="z-[98]">
    <ImpersonateUserForm {toast} {session} bind:show={showImpersonateUserForm} />
  </Backdrop>
{/if}
{#if showChangePermissionsForm && session}
  <Backdrop zIndex="z-[98]">
    <ChangePermisisonsForm {toast} {session} {isUserOwner} bind:show={showChangePermissionsForm} />
  </Backdrop>
{/if}
{#if show}
  <div class="fixed right-4 bottom-4 card z-[99] p-4" transition:fade={{ duration: 150 }}>
    <span class="font-medium block text-lg">Dev Menu</span>
    <span class="text-sm font-medium mt-4 mb-2 block">Commands</span>
    <span class="text-sm text-surface-600-300-token">
      All commands are prefixed with <span class="badge variant-filled opacity-50">Ctrl</span> <span class="badge variant-filled opacity-50">Shift</span>.
    </span>
    <div class="flex flex-col gap-1 mt-2">
      {#each Object.entries(generalCommands) as [key, description]}
        <div>
          <span class="badge variant-filled">{key}</span>
          <span class="text-sm">{description}.</span>
        </div>
      {/each}
    </div>
    <span class="text-sm font-medium block mt-4 mb-2">Permissions</span>
    <div class="mt-2">
      <span class={`badge text-black ${isUserOwner ? 'bg-success-500' : 'bg-error-500'}`}>Owner</span>
      <span class={`badge text-black ${session?.admin ? 'bg-success-500' : 'bg-error-500'}`}>Admin</span>
      <span class={`badge text-black ${session?.approvedHost ? 'bg-success-500' : 'bg-error-500'}`}>Approved Host</span>
    </div>
  </div>
{/if}