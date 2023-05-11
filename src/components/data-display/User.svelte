<script lang="ts">
  import { Avatar, modalStore, popup, toastStore } from '@skeletonlabs/skeleton';
  import { buildUrl } from 'osu-web.js';
  import type { PopupSettings } from '@skeletonlabs/skeleton';
  import { page } from '$app/stores';
  import { trpc } from '$trpc/client';

  export let data: {
    user: {
      id: number
      isAdmin: Boolean
      isRestricted: Boolean
      osuUserId: number
      osuUsername: string
      discordUsername: string
      discordDiscriminator: number
      showDiscordTag: Boolean
      country: {
        name: string,
        code: string
      }
    };
    options: {
      forceShowDiscord: Boolean,
      managementOptions: Boolean
    };
  };

  const popupUserManage: PopupSettings = {
    event: 'click',
    target: 'popupUserManage',
    placement: 'bottom'
  };

  function adminChange(user: {
    id: number,
    isAdmin: Boolean,
    osuUsername: string
  }) {
    let isAdmin = user.isAdmin
    modalStore.trigger({
      type: 'confirm',
      title: `${isAdmin ? "Removing" : "Adding"} an admin`,
      body: `Are you sure you want to <strong>${isAdmin ? "REMOVE" : "ADD"} ${user.osuUsername}</strong> ${isAdmin ? "from" : "to"} admins?`,
      response: async (r: boolean) => {
        if (r === true) {
          let success = await trpc($page).users.changeAdminStatus.mutate({id: user.id, toAdmin: !isAdmin})
          toastStore.trigger({message: success ? "Success!" : "Something went wrong..."});
        }
      }
    });
  }

  function deleteUser(user: {
    id: number,
    isAdmin: Boolean,
    osuUsername: string
  }) {
    modalStore.trigger({
      type: 'confirm',
      title: 'Deleting an user',
      body: `Are you definitely sure you want to <strong>COMPLETELY DELETE ${user.osuUsername}?</strong> There's no coming back from this!`,
      response: async (r: boolean) => {
        if (r === true) {
          let deletedUser = await trpc($page).users.deleteUser.mutate(user.id)
          toastStore.trigger({message: `${deletedUser.osuUsername} has been successfully deleted!`});
        }
      }
    });
  }
</script>

<div class="card w-64 p-4 bg-surface-backdrop-token">
  <div class="grid grid-cols-4 gap-0">
    <div class="row-span-2">
      <Avatar
        src={buildUrl.userAvatar(data.user.osuUserId)}
        rounded="rounded-md"
        width="w-12"
      />
    </div>
    <div class="col-span-2 flex">
      <a href={buildUrl.user(data.user.osuUserId)} target="_blank"
        >{data.user.osuUsername}</a
      >
      <img
        class="h-4 ml-1"
        src={buildUrl.custom(`images/flags/${data.user.country.code}.png`)}
        alt={`Flag of ${data.user.country.name}`}
      >
    </div>
    <div class="col-span-1">
    </div>
    <div class="col-span-3">
      {#if data.user.showDiscordTag || data.options.forceShowDiscord}
        {data.user.discordUsername}#{data.user.discordDiscriminator}
      {/if}
    </div>
    <div class="mt-2 col-span-4 row-span-4">
      {#if data.user.isAdmin}
        <span class="badge variant-filled-secondary mx-auto">Kyoso Admin</span>
      {/if}
      {#if data.user.isRestricted}
        <span class="badge variant-filled-error mx-auto">Restricted</span>
      {/if}
    </div>
    {#if data.options.managementOptions}
      <div class="mt-2 col-span-4 row-span-4">
        <button class="mx-auto btn variant-filled-tertiary" use:popup={popupUserManage}>Manage User...</button>
        <div class="card p-4 max-w-sm" data-popup="popupUserManage">
          <div class="grid grid-cols-1 gap-2">
            <button class="btn variant-filled-error" on:click={() => {adminChange(data.user)}}>{data.user.isAdmin ? "Remove" : "Add"} Admin</button>
            <button class="btn variant-filled-error" on:click={() => {deleteUser(data.user)}}>Delete User</button>
          </div>
          <div class="arrow bg-surface-100-800-token" />
        </div>
      </div>
    {/if}
  </div>
</div>
