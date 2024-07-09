<script lang="ts">
  import { Link, GripVertical, Pencil, X } from 'lucide-svelte';
  import { dragHandle } from 'svelte-dnd-action';
  import type { TournamentLink } from '$types';

  export let link: TournamentLink;
  export let onUpdate: () => void;
  export let onDelete: () => void;
</script>

<div class="w-full flex card bg-surface-200-700-token">
  <div
    class="rounded-md p-2 btn hover:variant-soft-surface handle"
    use:dragHandle
    aria-label={`drag-handle for ${link.label}`}
  >
    <GripVertical size={24} class="dark:stroke-white stroke-black" />
  </div>
  <div class="grid grid-cols-[auto_1fr] w-full gap-4 p-4 items-center">
    <div class="flex max-xs:flex-col-reverse gap-2 xs:gap-4 items-start xs:items-center">
      <div>
        <!-- TODO: Add icons, the below is just a placeholder -->
        <Link size={32} class="dark:stroke-white stroke-black hidden xs:block" />
        <Link size={20} class="dark:stroke-white stroke-black block xs:hidden" />
      </div>
      <div>
        <div class="font-medium flex items-center h-full 2md:h-max">
          <a
            href={link.url}
            class="inline 2md:hidden max-2md:underline max-2md:hover:text-primary-500 duration-150"
            >{link.label}</a
          >
          <span class="hidden 2md:inline">{link.label}</span>
        </div>
        <div class="hidden 2md:inline-block 2md:w-[28rem] lg:w-[36rem] 2lg:w-[40rem] truncate">
          <a
            href={link.url}
            class="text-surface-600-300-token hover:text-primary-600-300-token duration-150 text-sm underline w-full"
            >{link.url}</a
          >
        </div>
      </div>
    </div>
    <div class="flex items-center justify-end gap-2">
      <button class="btn btn-icon variant-filled" on:click={onUpdate}>
        <Pencil size={20} />
      </button>
      <button class="btn btn-icon variant-filled-error" on:click={onDelete}>
        <X size={20} />
      </button>
    </div>
  </div>
</div>
