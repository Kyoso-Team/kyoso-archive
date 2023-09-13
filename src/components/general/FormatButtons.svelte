<script lang="ts">
  import { modalStore, popup } from '@skeletonlabs/skeleton';
  import { tooltip } from '$lib/utils';
  import Tooltip from './Tooltip.svelte';
  import {
    BlockQuoteIcon,
    BoldIcon,
    CodeBlockIcon,
    CodeIcon,
    ImageIcon,
    ItalicsIcon,
    LinkIcon,
    StrikethroughIcon
  } from '$components/icons';
  import type { ComponentType } from 'svelte';

  export let markdown: string;
  export let textareaRef: HTMLTextAreaElement;

  interface Format {
    label: string;
    value?: string;
    endValue?: string;
    icon: ComponentType;
  }

  let formats: Format[] = [
    { label: 'Bold', value: '**', icon: BoldIcon },
    { label: 'Italics', value: '_', icon: ItalicsIcon },
    { label: 'Strikethrough', value: '~~', icon: StrikethroughIcon },
    { label: 'Inline Code', value: '`', icon: CodeIcon },
    { label: 'Code Block', value: '```\n', endValue: '\n```', icon: CodeBlockIcon },
    { label: 'Block Quote', value: '>', endValue: '', icon: BlockQuoteIcon },
    { label: 'Image', icon: ImageIcon },
    { label: 'Link', icon: LinkIcon }
  ];

  function insertFormatting(value?: string, endValue?: string) {
    const { selectionStart, selectionEnd } = textareaRef;
    const content = textareaRef.value;
    const updatedContent =
      content.substring(0, selectionStart) +
      value +
      content.substring(selectionStart, selectionEnd) +
      (endValue ?? value) +
      content.substring(selectionEnd);

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
          type: 'prompt',
          title: 'Add URL',
          body: 'Please input a url.',
          response: (link: string) => link && insertFormatting(`[link](${link})`, '')
        });
      default:
        insertFormatting(format.value, format.endValue);
    }
  }
</script>

<div class="w-full space-x-3">
  {#each formats as format}
    <button on:mousedown={(e) => e.preventDefault()} on:click={() => handleClick(format)}>
      <Tooltip target={format.label} label={format.label} />
      <div use:popup={tooltip(format.label)}>
        <svelte:component this={format.icon} w={20} h={20} />
      </div>
    </button>
  {/each}
</div>
