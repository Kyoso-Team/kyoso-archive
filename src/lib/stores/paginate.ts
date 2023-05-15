import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import type { PageStore, Sort } from '$types';

function createPaginate() {
  const { subscribe } = writable<{
    page?: number;
    search?: string;
    filters: Record<string, string>;
    sort: Record<string, string>;
  }>({
    filters: {},
    sort: {}
  });

  function setPage(pageStore: PageStore, page: number) {
    if (typeof window === 'undefined') return;

    let url = pageStore.url;
    url.searchParams.set('page', page.toString());

    goto(url.search, {keepFocus: true, invalidateAll: true});
  }

  function setSearch(pageStore: PageStore, searchQuery: string | undefined | null) {
    if (typeof window === 'undefined') return;
    let url = pageStore.url;

    if (searchQuery) {
      url.searchParams.set('search', encodeURIComponent(searchQuery));
    } else {
      url.searchParams.delete('search');
    }

    goto(url.search, {keepFocus: true, invalidateAll: true});
  }

  function setFilter(
    pageStore: PageStore,
    filterName: string,
    filterValue: string | number | boolean | undefined | null
  ) {
    if (typeof window === 'undefined') return;
    let url = pageStore.url;

    if (filterValue) {
      let value =
        typeof filterValue === 'boolean'
          ? filterValue
            ? 'true'
            : 'false'
          : filterValue.toString();

      url.searchParams.set(`f.${filterName}`, value);
    } else {
      url.searchParams.delete(`f.${filterName}`);
    }

    goto(url.search, {keepFocus: true, invalidateAll: true});
  }

  function setSort(pageStore: PageStore, sortName: string, sortValue: Sort | null | undefined) {
    if (typeof window === 'undefined') return;
    let url = pageStore.url;

    if (sortValue) {
      url.searchParams.set(`s.${sortName}`, sortValue);
    } else {
      url.searchParams.delete(`s.${sortName}`);
    }

    goto(url.search, {keepFocus: true, invalidateAll: true});
  }

  return {
    subscribe,
    setPage,
    setSearch,
    setFilter,
    setSort
  };
}

export const paginate = createPaginate();
