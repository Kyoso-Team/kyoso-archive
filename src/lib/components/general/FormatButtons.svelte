<!-- NOTE: To be re-implemented
<script lang="ts">
  import { getModalStore, popup } from '@skeletonlabs/skeleton';
  import { tooltip } from '$lib/utils';
  import Tooltip from './Tooltip.svelte';
  import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Image,
    Link,
    TextQuote,
    FileJson
  } from 'lucide-svelte';
  import type { ComponentType } from 'svelte';
  import type { LinkModalResponse } from '$types';

  export let markdown: string;
  export let textareaRef: HTMLTextAreaElement;
  let modalStore = getModalStore();

  interface Format {
    label: string;
    value?: string;
    endValue?: string;
    icon: ComponentType;
  }

  let formats: Format[] = [
    { label: 'Bold', value: '**', icon: Bold },
    { label: 'Italics', value: '_', icon: Italic },
    { label: 'Strikethrough', value: '~~', icon: Strikethrough },
    { label: 'Inline Code', value: '`', icon: Code },
    { label: 'Code Block', value: '```\n', endValue: '\n```', icon: FileJson },
    { label: 'Block Quote', value: '>', endValue: '', icon: TextQuote },
    { label: 'Image', icon: Image },
    { label: 'Link', icon: Link }
  ];

  function insertFormatting(value?: string, endValue?: string) {
    const { selectionStart, selectionEnd } = textareaRef;
    const updatedContent =
      markdown.substring(0, selectionStart) +
      value +
      markdown.substring(selectionStart, selectionEnd) +
      (endValue ?? value) +
      markdown.substring(selectionEnd);

    markdown = updatedContent;
  }

  function handleClick(format: Format) {
    switch (format.label) {
      case 'Image':
        return modalStore.trigger({
          type: 'prompt',
          title: 'Add Image',
          body: 'Please input the image url.',
          response: (link: string) => link && insertFormatting(`![img](${link})`, '')
        });
      case 'Link':
        return modalStore.trigger({
          type: 'component',
          component: 'linkModal',
          response: (r: LinkModalResponse) =>
            r && insertFormatting(`[${r.displayText}](${r.link})`, '')
        });
      default:
        insertFormatting(format.value, format.endValue);
    }
  }
</script>

<div class="w-full space-x-3">
  {#each formats as format}
    <button
      on:mousedown={(e) => e.preventDefault()}
      on:click={() => handleClick(format)}
      class="transform transition-transform hover:text-[#b4b1b4] active:scale-95"
    >
      <Tooltip target={format.label} label={format.label} />
      <div use:popup={tooltip(format.label)}>
        <svelte:component this={format.icon} size={20} />
      </div>
    </button>
  {/each}
</div> -->
