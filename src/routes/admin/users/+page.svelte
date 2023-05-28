<script lang="ts">
  import { modalStore, toastStore, popup } from '@skeletonlabs/skeleton';
  import { paginate } from '$stores';
  import { SearchBar, Paginator, User } from '$components';
  import { page } from '$app/stores';
  import { trpc } from '$trpc/client';
  import type { PageServerData } from './$types';
  import type { PopupSettings } from '@skeletonlabs/skeleton';

  export let data: PageServerData;

  function onSearch({ detail }: CustomEvent<string | null>) {
    paginate.setSearch($page, detail);
  }

  function onPageChange({ detail }: CustomEvent<number>) {
    paginate.setPage($page, detail);
  }

  export function adminChange(user: {
    id: number,
    isAdmin: boolean,
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

  export function deleteUser(user: {
    id: number,
    isAdmin: boolean,
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

  const popupUserManage: PopupSettings = {
    event: 'click',
    target: 'popupUserManage',
    placement: 'bottom'
  }
</script>

<div class="center-content">
  <SearchBar label="Search Users" on:search={onSearch} />
    <div>
      <h2 class="pl-1 pb-1">Users</h2>
      <div class="card mb-2 flex min-w-[18.5rem] max-w-5xl flex-wrap justify-center gap-4 p-4">
        {#if data.users.length === 0}
          <div class="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="75"
              height="75"
              viewBox="0 0 24 24"
              class="fill-primary-500"
            >
              <path
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 0 0 9.5 3C6.08 3 3.28 5.64 3.03 9h2.02C5.3 6.75 7.18 5 9.5 5C11.99 5 14 7.01 14 9.5S11.99 14 9.5 14c-.17 0-.33-.03-.5-.05v2.02c.17.02.33.03.5.03c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z"
              />
              <path
                d="M6.47 10.82L4 13.29l-2.47-2.47l-.71.71L3.29 14L.82 16.47l.71.71L4 14.71l2.47 2.47l.71-.71L4.71 14l2.47-2.47z"
              />
            </svg>
            No results found
          </div>
        {:else}
          {#each data.users as user}
            <div>
              <User
                data={{
                  user: user,
                  options: {
                    forceShowDiscord: true
                  }
                }}
              />
              <button class="mt-2 block mx-auto btn variant-filled-tertiary" use:popup={popupUserManage}>Manage User...</button>
              <div class="card p-4 max-w-sm" data-popup="popupUserManage">
                <div class="grid grid-cols-1 gap-2">
                  <button class="btn variant-filled-error" on:click={() => {adminChange(user)}}>{user.isAdmin ? "Remove" : "Add"} Admin</button>
                  <button class="btn variant-filled-error" on:click={() => {deleteUser(user)}}>Delete User</button>
                </div>
                <div class="arrow bg-surface-100-800-token" />
              </div>
            </div>
          {/each}
        {/if}
      </div>
      <Paginator count={data.userCount} page={data.page} on:change={onPageChange} />
    </div>
</div>
