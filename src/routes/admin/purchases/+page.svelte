<script lang="ts">
  import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
  import { paginate } from '$stores';
  import {
    SearchBar,
    Paginator,
    Purchase,
    AscendingIcon,
    DescendingIcon,
    SearchResults
  } from '$components';
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
            <AscendingIcon w={20} h={20} styles="fill-white" />
          </RadioItem>
          <RadioItem
            name="sortPurchasedAt"
            value="desc"
            title="Descending"
            bind:group={purchasedAt}
          >
            <DescendingIcon w={20} h={20} styles="fill-white" />
          </RadioItem>
        </RadioGroup>
      </section>
    </div>
  </div>
  <SearchResults label="Purchases" resultCount={data.purchaseCount}>
    {#each data.purchases as purchase}
      <Purchase {purchase} />
    {/each}
    <svelte:fragment slot="footer">
      <Paginator count={data.purchaseCount} page={data.page} on:change={onPageChange} />
    </svelte:fragment>
  </SearchResults>
</div>
