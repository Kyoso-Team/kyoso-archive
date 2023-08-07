<script lang="ts">
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { error, sidebar } from '$stores';
  import { onMount } from 'svelte';
  import { Converter } from 'showdown';
  import { SEO } from '$components';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let markdown = data.rules || '';
  let btnsDisabled = true;
  let preview = false;

  onMount(() => {
    sidebar.setSelected('Settings', 'Referee', 'Rules');
  });

  function onUndoChanges() {
    markdown = data.rules || '';
  }

  async function onUpdate() {
    try {
      await trpc($page).tournaments.updateTournament.mutate({
        tournamentId: data.id,
        where: {
          id: data.id
        },
        data: {
          rules: markdown === '' ? null : markdown.trim().replace(/\n{3,}\s*/g, '\n\n')
        }
      });

      data.rules = markdown;
    } catch (err) {
      console.error(err);
      error.set($error, err, 'close', true);
    }
  }

  function togglePreview() {
    preview = !preview;
  }

  $: {
    btnsDisabled = markdown === (data.rules || '');
  }
</script>

<SEO
  page={$page}
  title={`Rules - ${data.acronym}`}
  description={`Manage the rules for ${data.acronym} (${data.name})`}
  noIndex
/>
<div class="center-content">
  <h1>Rules</h1>
  <p class="pt-4">
    Rules are written in <a href="https://www.markdownguide.org/cheat-sheet">Markdown</a>.
  </p>
  <div
    class={`mt-4 w-[42rem] ${
      preview
        ? 'document min-h-[18rem] rounded-md px-8 py-4 text-left bg-surface-100-800-token'
        : 'h-72'
    }`}
  >
    {#if preview}
      {@html new Converter({
        ghCodeBlocks: true
      }).makeHtml(markdown)}
    {:else}
      <textarea class="input h-full w-full resize-none px-2 py-1" bind:value={markdown} />
    {/if}
  </div>
  <div class="mt-4 grid w-[42rem] grid-cols-[auto_auto]">
    <div>
      <button
        class="btn variant-filled-secondary"
        disabled={markdown === ''}
        on:click={togglePreview}
      >
        {preview ? 'Edit' : 'Preview'}
      </button>
    </div>
    <div class="flex justify-end gap-2">
      <button class="variant-ringed-primary btn" disabled={btnsDisabled} on:click={onUndoChanges}
        >Undo Changes</button
      >
      <button class="btn variant-filled-primary" disabled={btnsDisabled} on:click={onUpdate}
        >Update</button
      >
    </div>
  </div>
</div>
