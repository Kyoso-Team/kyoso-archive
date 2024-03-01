<script lang="ts">
  import User from './User.svelte';
  import { SEO } from '$components/general';
  import { page } from '$app/stores';
  import { formatNumber } from '$lib/utils';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let users: Record<'admins' | 'banned' | 'hosts' | 'owners', PageServerData['users']> = {
    admins: [],
    banned: [],
    hosts: [],
    owners: []
  };
  let userTypes: {
    typeLabel: string;
    type: 'admin' | 'host' | 'banned' | 'owner';
    description: string;
    users: PageServerData['users'];
  }[] = [];
  const toast = getToastStore();

  $: {
    users = {
      owners: data.users.filter(({ osu }) => osu.osuUserId === data.ownerId),
      admins: data.users.filter(({ admin, osu }) => admin && osu.osuUserId !== data.ownerId),
      hosts: data.users.filter(({ approvedHost }) => approvedHost),
      banned: data.users.filter(({ banned }) => banned)
    };
  }

  $: {
    userTypes = [{
      typeLabel: 'Owner',
      type: 'owner',
      description: 'The website owner.',
      users: users.owners
    }, {
      typeLabel: 'Admins',
      type: 'admin',
      description: 'Users with administrative permissions.',
      users: users.admins
    }, {
      typeLabel: 'Approved Hosts',
      type: 'host',
      description: 'Users who are approved to be able to create (and therefore, host) tournaments.',
      users: users.hosts
    }, {
      typeLabel: 'Banned Users',
      type: 'banned',
      description: 'Users who are banned from using Kyoso and can no longer log in.',
      users: users.banned
    }];
  }
</script>

<SEO page={$page} title="Manage Users" description="Manage Kyoso users" noIndex />
<main class="main flex justify-center">
  <div class="w-full max-w-[48rem]">
    <h1>Manage Users</h1>
    <div class="line-b mt-4 mb-8" />
    <h2>Users</h2>
    <p class="mt-2 mb-4">There {data.counts.total === 1 ? 'is 1 user' : `are ${formatNumber(data.counts.total)} users`} registered to Kyoso. Use the search bar below if you wish to look one up.</p>
    <div>

    </div>
    {#each userTypes as { description, type, typeLabel, users: userList }}
      <div class="line-b my-8" />
      <h2>{typeLabel}</h2>
      <p class="mt-2">{description}</p>
      <div class="flex gap-2 mt-4 flex-wrap">
        {#each userList as user}
          <User {user} {type} {toast} isCurrentUserTheOwner={data.isCurrentUserTheOwner} bind:users={users} />
        {/each}
      </div>
    {/each}
  </div>
</main>