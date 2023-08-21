<script lang="ts">
  import { toastStore } from '@skeletonlabs/skeleton';
  import { paginate } from '$stores';
  import { SEO, SearchBar, Paginator, User, Dropdown, SearchResults } from '$components';
  import { page } from '$app/stores';
  import { trpc } from '$trpc/client';
  import { modal } from '$lib/utils';
  import { invalidateAll } from '$app/navigation';
  import type { PageServerData } from './$types';

  export let data: PageServerData;

  function onSearch({ detail }: CustomEvent<string | null>) {
    paginate.setSearch($page, detail);
  }

  function onPageChange({ detail }: CustomEvent<number>) {
    paginate.setPage($page, detail);
  }

  export function adminChange(user: { id: number; isAdmin: boolean; osuUsername: string }) {
    let isAdmin = user.isAdmin;

    modal.yesNo(
      `${isAdmin ? 'Removing' : 'Adding'} an admin`,
      `Are you sure you want to <strong>${isAdmin ? 'REMOVE' : 'ADD'} ${
        user.osuUsername
      }</strong> ${isAdmin ? 'from' : 'to'} admins?`,
      async () => {
        let success = await trpc($page).users.changeAdminStatus.mutate({
          id: user.id,
          toAdmin: !isAdmin
        });
        await invalidateAll();
        toastStore.trigger({ message: success ? 'Success!' : 'Something went wrong...' });
      }
    );
  }

  export function deleteUser(user: { id: number; isAdmin: boolean; osuUsername: string }) {
    modal.yesNo(
      'Deleting a user',
      `Are you definitely sure you want to <strong>COMPLETELY DELETE ${user.osuUsername}?</strong> There's no coming back from this!`,
      async () => {
        let deletedUser = await trpc($page).users.deleteUser.mutate(user.id);
        await invalidateAll();
        toastStore.trigger({
          message: `${deletedUser.osuUsername} has been successfully deleted!`
        });
      }
    );
  }
</script>

<SEO page={$page} title="Users - Admin" description="Manage users" noIndex />
<div class="center-content">
  <SearchBar label="Search Users" on:search={onSearch} />
  <SearchResults label="Users" resultCount={data.userCount}>
    {#each data.users as user}
      <div class="relative">
        <User {user} showDiscordTag />
        <Dropdown name={`user-${user.id}`} styles="absolute top-0 right-2">
          <button
            class={`btn btn-sm ${user.isAdmin ? 'variant-filled-error' : 'variant-filled'}`}
            on:click={() => adminChange(user)}>{user.isAdmin ? 'Remove' : 'Make'} Admin</button
          >
          <button class="btn btn-sm variant-filled-error" on:click={() => deleteUser(user)}
            >Delete User</button
          >
        </Dropdown>
      </div>
    {/each}
    <svelte:fragment slot="footer">
      <Paginator count={data.userCount} page={data.page} on:change={onPageChange} />
    </svelte:fragment>
  </SearchResults>
</div>
