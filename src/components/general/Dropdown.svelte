<script lang="ts">
  import { EditIcon } from '$components';
  import { popup } from '@skeletonlabs/skeleton';
  import type { PopupSettings } from '@skeletonlabs/skeleton';

  export let name: string;
  export let styles: string = '';

  const menuPopup: PopupSettings = {
    event: 'click',
    placement: 'bottom',
    target: name
  };
</script>

<button class={`mt-2 block mx-auto btn btn-sm variant-filled px-2 ${styles}`.trim()} use:popup={menuPopup}>
  <slot name="btn">
    <EditIcon w={15} h={15} styles="fill-black" />
  </slot>
</button>
<div class="bg-surface-100-800-token rounded-md p-3 max-w-sm z-50 border-primary-500 border-[1px] relative" data-popup={name}>
  <div class="flex flex-col gap-2">
    <slot />
  </div>
  <div class="top-0 w-[90%] rounded-full left-1 h-2 bg-inherit absolute z-[49]" />
  <div class="arrow bg-surface-100-800-token border-primary-500 border-[1px] relative z-[48]" />
</div>