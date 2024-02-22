<script lang="ts">
  import { Search } from 'lucide-svelte';
  import type { MaybePromise } from '@sveltejs/kit';

  export let label: string = 'Search';
  export let center: boolean = false;
  export let onSearch: (query: string | null) => MaybePromise<void>;
  let input: string | null = null;

  function search() {
    onSearch(input === '' ? null : input);
  }

  function onEnterKey(e: KeyboardEvent) {
    if (e.key === 'Enter') return;
    search();
  }
</script>

<div class={`${center ? 'flex justify-center' : ''} mb-6`}>
  <label class="label">
    <span>{label}</span>
    <div
      class="input-group input-group-divider w-max grid-cols-[max-content_12rem_max-content] md:grid-cols-[max-content_24rem_max-content]"
    >
      <div class="input-group-shim">
        <Search size={30} />
      </div>
      <input
        type="text"
        placeholder="Search..."
        bind:value={input}
        on:keydown={onEnterKey}
      />
      <button class="variant-filled-primary" on:click={search}>Search</button>
    </div>
  </label>
</div>
