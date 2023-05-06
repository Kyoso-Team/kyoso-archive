<script lang="ts">
  import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
  import { paginate } from '$stores';
  import { SearchBar, Paginator, Purchase } from '$components';
  import { page } from '$app/stores';
  import type { PageServerData } from './$types';
  import type { Sort } from '$types';

  export let data: PageServerData;
  let purchasedAt: Sort = 'desc';

  function onSearch({ detail }: CustomEvent<string | null>) {
    paginate.setSearch($page, detail);
  }

  function onPageChange({ detail }: CustomEvent<number>) {
    paginate.setPage($page, detail);
  }

  $: {
    paginate.setSort($page, 'purchasedAt', purchasedAt);
  }
</script>

<div class="center-content">
  <SearchBar label="Search Purchases" on:search={onSearch} />
  <div class="mb-6">
    <h2 class="pl-1 pb-1">Sorting</h2>
    <div class="card flex min-w-[18.5rem] max-w-3xl justify-center p-4">
      <section class="flex w-max flex-col">
        <span class="pl-1 font-bold">Date</span>
        <RadioGroup active="variant-filled-secondary" hover="hover:variant-soft-secondary">
          <RadioItem name="sortPurchasedAt" value="asc" title="Ascending" bind:group={purchasedAt}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
              <path
                fill="white"
                d="m12.927 2.573l3 3A.25.25 0 0 1 15.75 6H13.5v6.75a.75.75 0 0 1-1.5 0V6H9.75a.25.25 0 0 1-.177-.427l3-3a.25.25 0 0 1 .354 0ZM0 12.25a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75Zm0-4a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5H.75A.75.75 0 0 1 0 8.25Zm0-4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5H.75A.75.75 0 0 1 0 4.25Z"
              />
            </svg>
          </RadioItem>
          <RadioItem
            name="sortPurchasedAt"
            value="desc"
            title="Descending"
            bind:group={purchasedAt}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
              <path
                fill="white"
                d="M0 4.25a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5H.75A.75.75 0 0 1 0 4.25Zm0 4a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5H.75A.75.75 0 0 1 0 8.25Zm0 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75ZM13.5 10h2.25a.25.25 0 0 1 .177.427l-3 3a.25.25 0 0 1-.354 0l-3-3A.25.25 0 0 1 9.75 10H12V3.75a.75.75 0 0 1 1.5 0V10Z"
              />
            </svg>
          </RadioItem>
        </RadioGroup>
      </section>
    </div>
  </div>
  <div>
    <h2 class="pl-1 pb-1">Purchases</h2>
    <div class="card mb-2 flex min-w-[18.5rem] max-w-5xl flex-wrap justify-center gap-4 p-4">
      {#if data.purchases.length === 0}
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
        {#each data.purchases as purchase}
          <Purchase {purchase} />
        {/each}
      {/if}
    </div>
    <Paginator count={data.purchaseCount} page={data.page} on:change={onPageChange} />
  </div>
</div>
