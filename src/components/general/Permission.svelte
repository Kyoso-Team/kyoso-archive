<script lang="ts">
  import isEqual from 'lodash.isequal';
  import { SlideToggle } from '@skeletonlabs/skeleton';
  import type { StaffPermission } from '$types';

  export let label: string;
  export let description: string;
  export let permissions: StaffPermission[];
  export let permissionName: StaffPermission;
  export let disabled = false;
  export let noBorder = false;
  export let noMargin = false;
  let permissionsCopy = [...permissions];
  let checked = permissions.includes(permissionName);

  function onToggle() {
    setTimeout(() => {
      permissions = checked
        ? [...permissions, permissionName]
        : [...permissions.filter((perm) => perm !== permissionName)];
      permissionsCopy = permissions;
    }, 10);
  }

  $: {
    if (!isEqual(permissions, permissionsCopy)) {
      checked = permissions.includes(permissionName);
      permissionsCopy = permissions;
    }
  }
</script>

<div class={`pt-4${noBorder && !noMargin ? ' mb-4' : ''}`}>
  <div class="flex px-2">
    <div class="flex w-full flex-col">
      <span class="font-bold">{label}</span>
      <span class="pr-8 text-sm text-gray-300">{description}</span>
    </div>
    <div class="flex items-center">
      <SlideToggle
        name={permissionName}
        active="bg-primary-500"
        {disabled}
        on:click={onToggle}
        bind:checked
      />
    </div>
  </div>
  {#if !noBorder}
    <div class="mt-4 w-full border-b border-surface-500/50" />
  {/if}
</div>
