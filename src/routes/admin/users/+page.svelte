<script lang="ts">
  import { paginate } from '$stores';
  import { SearchBar, Paginator, User } from '$components';
  import { page } from '$app/stores';
  import type { PageServerData } from './$types';

  export let data: PageServerData;

  function onSearch({ detail }: CustomEvent<string | null>) {
    paginate.setSearch($page, detail);
  }

  function onPageChange({ detail }: CustomEvent<number>) {
    paginate.setPage($page, detail);
  }
</script>

<div class="center-content">
  <SearchBar label="Search Users" on:search={onSearch} />
  {#if Boolean($page.url.searchParams.get("search")?.length)}
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
            <User
              data={{
                user: user,
                options: {
                  forceShowDiscord: true,
                  managementOptions: true
                }
              }}
            />
          {/each}
        {/if}
      </div>
      <Paginator count={data.userCount} page={data.page} on:change={onPageChange} />
    </div>
  {/if}
</div>
