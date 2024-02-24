<!-- <script lang="ts">
  import { trpc } from '$lib/trpc';
  import { page } from '$app/stores';
  import { error, tournamentSidebar } from '$stores';
  import { onMount } from 'svelte';
  import { SEO, FormatButtons } from '$components';
  import { ProgressBar } from '@skeletonlabs/skeleton';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let markdown = data.rules || '';
  let textareaRef: HTMLTextAreaElement;
  let btnsDisabled = true;
  let preview = false;
  let showLoader = false;
  // eslint-disable-next-line no-undef
  let delayTimer: NodeJS.Timeout | null = null;

  onMount(() => {
    tournamentSidebar.setSelected('Settings', 'Referee', 'Rules');
  });

  function onUndoChanges() {
    markdown = data.rules || '';
  }

  async function onUpdate() {
    try {
      const sanitizedMarkdown = await sanitize(markdown);

      await trpc($page).tournaments.updateTournament.mutate({
        tournamentId: data.id,
        where: {
          id: data.id
        },
        data: {
          rules: markdown === '' ? null : sanitizedMarkdown
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

  async function sanitize(input: string): Promise<string | undefined> {
    try {
      delayTimer = setTimeout(() => (showLoader = true), 800);
      const sanitizedHtml = await trpc($page).markdown.sanitize.query(`${input.trim()}\n\n`);

      clearTimeout(delayTimer);
      return sanitizedHtml;
    } catch (err) {
      showLoader = false;
      if (delayTimer) clearTimeout(delayTimer);

      console.error(err);
      error.set($error, err, 'close', true);
    }
  }

  $: btnsDisabled = markdown === (data.rules || '') || preview;
  $: if (!preview && textareaRef) textareaRef.focus();
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
      {#await sanitize(markdown)}
        {#if showLoader}
          <span>Loading Markdown...</span>
          <ProgressBar />
        {/if}
      {:then value}
        {@html value}
      {:catch}
        <span>Failed to load preview.</span>
      {/await}
    {:else}
      <FormatButtons bind:markdown {textareaRef} />

      <textarea
        class="input h-full w-full resize-none px-2 py-1"
        bind:value={markdown}
        bind:this={textareaRef}
      />
    {/if}
  </div>
  <div class="mt-10 grid w-[42rem] grid-cols-[auto_auto]">
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
      <button class="btn variant-ringed-primary" disabled={btnsDisabled} on:click={onUndoChanges}
        >Undo Changes</button
      >
      <button
        class="btn variant-filled-primary"
        disabled={btnsDisabled && !preview}
        on:click={onUpdate}>Update</button
      >
    </div>
  </div>
</div> -->
