<script lang="ts">
  import Backdrop from './Backdrop.svelte';
  import { modeCurrent, setModeCurrent, setModeUserPrefers } from '@skeletonlabs/skeleton';
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { browser } from '$app/environment';
  import {
    ChangePermisisonsForm,
    ChangeStaffPermissionsForm,
    ImpersonateUserForm
  } from '$lib/components/dev-menu';
  import { staffPermissionsOptions } from '$lib/form/common';
  import { devMenuCtx, loading, toast } from '$lib/stores';

  let show = localStorage.getItem('show_dev_menu') === 'false' ? false : true;
  let showImpersonateUserForm = false;
  let showChangePermissionsForm = false;
  let showChangeStaffPermissionsForm = false;
  const generalCommands: Record<string, string> = {
    '1': 'Toggle this menu',
    '2': 'Toggle between dark and light theme',
    '3': 'Impersonate user',
    '4': 'Set user permissions',
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
        toggleShowImpersonateUserForm();
        break;
      case '$':
        toggleShowChangePermissionsForm();
        break;
      case '^':
        toggleShowChangeStaffPermissionsForm();
        break;
      default:
        break;
    }
  }

  function toggleShow() {
    show = !show;
    localStorage.setItem('show_dev_menu', show ? 'true' : 'false');
  }

  function toggleShowImpersonateUserForm() {
    if ($loading || showChangePermissionsForm || showChangeStaffPermissionsForm) return;

    if (!$devMenuCtx?.session) {
      toast.error('Log in to execute this command');
      return;
    }

    showImpersonateUserForm = !showImpersonateUserForm;
  }

  function toggleShowChangePermissionsForm() {
    if ($loading || showImpersonateUserForm || showChangeStaffPermissionsForm) return;

    if (!$devMenuCtx?.session) {
      toast.error('Log in to execute this command');
      return;
    }

    showChangePermissionsForm = !showChangePermissionsForm;
  }

  function toggleShowChangeStaffPermissionsForm() {
    if ($loading || showImpersonateUserForm || showChangePermissionsForm) return;

    if (!$devMenuCtx?.staffMember) {
      toast.error(
        'Execute this command in /m/ pages while being a staff member for that tournament'
      );
      return;
    }

    showChangeStaffPermissionsForm = !showChangeStaffPermissionsForm;
  }

  function toggletheme() {
    $modeCurrent = !$modeCurrent;
    setModeUserPrefers($modeCurrent);
    setModeCurrent($modeCurrent);
  }
</script>

{#if $devMenuCtx}
  {#if showImpersonateUserForm && $devMenuCtx.session}
    <Backdrop zIndex="z-[98]">
      <ImpersonateUserForm session={$devMenuCtx.session} bind:show={showImpersonateUserForm} />
    </Backdrop>
  {/if}
  {#if showChangePermissionsForm && $devMenuCtx.session}
    <Backdrop zIndex="z-[98]">
      <ChangePermisisonsForm
        session={$devMenuCtx.session}
        isUserOwner={$devMenuCtx.isUserOwner}
        bind:show={showChangePermissionsForm}
      />
    </Backdrop>
  {/if}
  {#if showChangeStaffPermissionsForm && $devMenuCtx.tournament && $devMenuCtx.staffMember}
    <Backdrop zIndex="z-[98]">
      <ChangeStaffPermissionsForm
        tournament={$devMenuCtx.tournament}
        staffMember={$devMenuCtx.staffMember}
        bind:show={showChangeStaffPermissionsForm}
      />
    </Backdrop>
  {/if}
  {#if show}
    <div
      class="fixed right-4 bottom-4 card z-[99] p-4 w-[320px]"
      transition:fade={{ duration: 150 }}
    >
      <span class="font-medium block text-lg">Dev Menu</span>
      <span class="text-sm font-medium mt-4 mb-2 block">Commands</span>
      <span class="text-sm text-surface-600-300-token">
        All commands are prefixed with <span class="badge variant-filled opacity-50">Ctrl</span>
        <span class="badge variant-filled opacity-50">Shift</span>.
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
      <div class="mt-2 flex gap-1 flex-wrap">
        <span
          class={`block badge text-black ${$devMenuCtx.isUserOwner ? 'bg-success-500' : 'bg-error-500'}`}
          >Owner</span
        >
        <span
          class={`block badge text-black ${$devMenuCtx.session?.admin ? 'bg-success-500' : 'bg-error-500'}`}
          >Admin</span
        >
        <span
          class={`block badge text-black ${$devMenuCtx.session?.approvedHost ? 'bg-success-500' : 'bg-error-500'}`}
          >Approved Host</span
        >
      </div>
      <div class="mt-2 flex gap-1 flex-wrap">
        {#if !$devMenuCtx.staffMember || $devMenuCtx.staffMember.permissions.length === 0}
          <span class="text-sm text-surface-600-300-token"> No staff permissions set </span>
        {:else}
          {#each $devMenuCtx.staffMember.permissions as permission}
            <span class="block badge variant-filled-primary"
              >{staffPermissionsOptions[permission]}</span
            >
          {/each}
        {/if}
      </div>
    </div>
  {/if}
{/if}
