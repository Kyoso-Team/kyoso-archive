<script lang="ts">
  import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
  import { paginate } from '$stores';
  import { SEO, SearchBar, Paginator, Purchase, SearchResults } from '$components';
  import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-svelte';
  import { page } from '$app/stores';
  import type { PageServerData } from './$types';
  import type { Sort } from '$types';

  export let data: PageServerData;
  let purchasedAt: Sort = 'desc';

  function onSearch(query: string | null) {
    paginate.setSearch($page, query);
  }

  function onPageChange(pageNum: number) {
    paginate.setPage($page, pageNum);
  }

  $: {
    paginate.setSort($page, 'purchasedAt', purchasedAt);
  }
</script>

<SEO page={$page} title="Purchases - Admin" description="Manage purchases" noIndex />
<div class="center-content">
  <SearchBar label="Search Purchases" {onSearch} />
  <div class="mb-6">
    <h2 class="pb-1 pl-1">Sorting</h2>
    <div class="card flex min-w-[18.5rem] max-w-3xl justify-center p-4">
      <section class="flex w-max flex-col">
        <span class="pl-1 font-bold">Date</span>
        <RadioGroup active="variant-filled-secondary" hover="hover:variant-soft-secondary">
          <RadioItem name="sortPurchasedAt" value="asc" title="Ascending" bind:group={purchasedAt}>
            <ArrowUpNarrowWide size={20} />
          </RadioItem>
          <RadioItem
            name="sortPurchasedAt"
            value="desc"
            title="Descending"
            bind:group={purchasedAt}
          >
            <ArrowDownWideNarrow size={20} />
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
      <Paginator count={data.purchaseCount} page={data.page} {onPageChange} />
    </svelte:fragment>
  </SearchResults>
</div>
