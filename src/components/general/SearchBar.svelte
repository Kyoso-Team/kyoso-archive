<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { SearchIcon } from '$components';

  const dispatcher = createEventDispatcher<{
    search: string | null;
  }>();
  export let label: string = 'Search';
  export let center: boolean = false;
  let input: string | undefined;

  function search() {
    dispatcher('search', input === '' ? null : input);
  }
</script>

<div class={`${center ? 'flex justify-center' : ''} mb-6`}>
  <label class="label">
    <span>{label}</span>
    <div
      class="input-group input-group-divider w-max grid-cols-[max-content_12rem_max-content] md:grid-cols-[max-content_24rem_max-content]"
    >
      <div class="input-group-shim">
        <SearchIcon w={30} h={30} styles="fill-white" />
      </div>
      <input type="text" placeholder="Search..." bind:value={input} on:keydown={(event) => {if (event.key === "Enter") {search()}}} />
      <button class="variant-filled-primary" on:click={search}>Search</button>
    </div>
  </label>
</div>
