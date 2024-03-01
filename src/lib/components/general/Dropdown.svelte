<script lang="ts">
  import { popup } from '@skeletonlabs/skeleton';
  import { Pencil } from 'lucide-svelte';
  import type { PopupSettings } from '@skeletonlabs/skeleton';

  export let name: string;
  let styles = '';
  export { styles as class };

  const menuPopup: PopupSettings = {
    event: 'click',
    placement: 'bottom',
    target: name
  };
</script>

<div class={`relative ${styles}`.trim()}>
  <button
    class="btn btn-icon btn-icon-sm variant-filled rounded-md"
    use:popup={menuPopup}
  >
    <slot name="btn">
      <Pencil size={16} class="dark:fill-black fill-white" />
    </slot>
  </button>
  <div
    class="absolute top-12 z-10 w-48 rounded-md border border-primary-500 p-3 bg-surface-800 shadow-md"
    data-popup={name}
  >
    <div class="flex flex-col gap-2">
      <slot />
    </div>
    <div class="absolute left-1 top-0 z-[9] h-2 w-[90%] rounded-full bg-inherit" />
    <div class="arrow relative z-[8] border border-primary-500 bg-surface-800 shadow-md" />
  </div>
</div>
