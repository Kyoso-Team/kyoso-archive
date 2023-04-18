import type { PageStore } from '$types';
import { writable } from 'svelte/store';

function createPaginate() {
  const { subscribe, set } = writable<{
    page?: number;
    search?: string;
    filters: Record<string, string>;
    sort: Record<string, string>;
  }>({
    filters: {},
    sort: {}
  });

  function setPage(pageStore: PageStore, page: number) {
    pageStore.url.searchParams.set('page', page.toString());
  }

  function deletePage(pageStore: PageStore) {
    pageStore.url.searchParams.delete('page');
  }

  function setSearch(pageStore: PageStore, searchQuery: string) {
    pageStore.url.searchParams.set('search', searchQuery);
  }

  function deleteSearch(pageStore: PageStore) {
    pageStore.url.searchParams.delete('search');
  }

  function setFilter(
    pageStore: PageStore,
    filterName: string,
    filterValue: string | number | boolean
  ) {
    let value =
      typeof filterValue === 'boolean' ? (filterValue ? 'true' : 'false') : filterValue.toString();
    pageStore.url.searchParams.set(`f.${filterName}`, value);
  }

  function deleteFilter(pageStore: PageStore, filterName: string) {
    pageStore.url.searchParams.delete(`f.${filterName}`);
  }

  function setSort(pageStore: PageStore, sortName: string, sortValue: 'desc' | 'asc') {
    pageStore.url.searchParams.set(`s.${sortName}`, sortValue);
  }

  function deleteSort(pageStore: PageStore, sortName: string) {
    pageStore.url.searchParams.delete(`f.${sortName}`);
  }

  return {
    subscribe,
    set,
    page: {
      set: setPage,
      destroy: deletePage
    },
    search: {
      set: setSearch,
      destroy: deleteSearch
    },
    filters: {
      set: setFilter,
      destroy: deleteFilter
    },
    sort: {
      set: setSort,
      destroy: deleteSort
    }
  };
}

export const paginate = createPaginate();
