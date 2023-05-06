<script lang="ts">
  import { error } from '$stores';
  import { CodeBlock } from '@skeletonlabs/skeleton';
  import { page } from '$app/stores';

  function onRefresh() {
    error.destroy();
    // Full reload
    window.location.href = $page.url.toString();
  }

  function onClose() {
    error.destroy();
  }
</script>

{#if $error}
  <div class="card variant-filled-error w-80 sm:w-[32rem]">
    <header class="card-header text-2xl font-bold">Error</header>
    <section class="m-4">
      {#if $error.type === 'string'}
        {$error.message}
      {:else}
        <div class="max-h-52 overflow-y-scroll">
          <CodeBlock language="json" background="bg-surface-800" code={$error.message} />
        </div>
      {/if}
      {#if $error.canSubmitIssue}
        <span class="mt-4 block">If this error persists, feel free to submit an issue.</span>
      {/if}
    </section>
    <footer class="card-footer flex">
      {#if $error.canSubmitIssue}
        <div class="w-max">
          <!-- TODO: Submit issue -->
          <button class="btn variant-filled-surface">Submit Issue</button>
        </div>
      {/if}
      <div class="flex w-full justify-end">
        {#if $error.action === 'refresh'}
          <button class="btn variant-filled-surface" on:click={onRefresh}>Refresh</button>
        {:else}
          <button class="btn variant-filled-surface" on:click={onClose}>Close</button>
        {/if}
      </div>
    </footer>
  </div>
{/if}
