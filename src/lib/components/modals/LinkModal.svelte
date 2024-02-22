<!-- <script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  import { isUrl } from '$lib/utils';
  import type { AnyComponent, LinkModalResponse } from '$types';

  export let parent: AnyComponent;
  let modalStore = getModalStore();
  let displayText = '';
  let link = '';
  let invalidUrl = true;
  let attemptedSubmit = false;
  let disabled = true;

  function onSubmit() {
    attemptedSubmit = true;
    if ($modalStore[0].response && !invalidUrl) {
      $modalStore[0].response({
        displayText,
        link
      } satisfies LinkModalResponse);

      modalStore.close();
    }
  }

  $: invalidUrl = !isUrl(link);
  $: disabled = (invalidUrl && attemptedSubmit) || displayText == '' || link == '';
</script>

<div class="modal-example-form card w-modal space-y-4 p-4 shadow-xl">
  <header class="text-2xl font-bold">Add Embedded Link</header>
  <article>Please input display text and url.</article>

  <form class="modal-form space-y-4">
    <label class="label">
      <span>Display Text</span>
      <input
        bind:value={displayText}
        class="input"
        type="text"
        placeholder="Enter link display text..."
      />
    </label>
    <label class="label">
      <span>Link</span>
      <input bind:value={link} class="input" type="email" placeholder="Enter link url..." />
      {#if invalidUrl && attemptedSubmit}
        <span class="text-error-500">Please enter a valid url.</span>
      {/if}
    </label>
  </form>

  <footer class="modal-footer {parent.regionFooter}">
    <button class="btn {parent.buttonNeutral}" on:click={parent.onClose}
      >{parent.buttonTextCancel}</button
    >
    <button on:click={onSubmit} {disabled} class="btn {parent.buttonPositive}">Submit</button>
  </footer>
</div> -->
