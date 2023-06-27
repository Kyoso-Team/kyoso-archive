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

<button
  class={`btn btn-sm variant-filled mx-auto mt-2 block px-2 ${styles}`.trim()}
  use:popup={menuPopup}
>
  <slot name="btn">
    <EditIcon w={15} h={15} styles="fill-black" />
  </slot>
</button>
<div
  class="relative z-50 max-w-sm rounded-md border-[1px] border-primary-500 p-3 bg-surface-100-800-token"
  data-popup={name}
>
  <div class="flex flex-col gap-2">
    <slot />
  </div>
  <div class="absolute left-1 top-0 z-[49] h-2 w-[90%] rounded-full bg-inherit" />
  <div class="arrow relative z-[48] border-[1px] border-primary-500 bg-surface-100-800-token" />
</div>
