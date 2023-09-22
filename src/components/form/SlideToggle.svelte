<script lang="ts">
  import { SlideToggle } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';

  export let name: string;
  export let label: string;
  export let defaultValue: boolean = false;
  export let value: boolean;
  export let disabled = false;

  onMount(() => {
    if (defaultValue) {
      value = defaultValue;
    }
  });
</script>

<label class="label">
  <input type="checkbox" class="hidden" />
  <SlideToggle
    active="bg-primary-500"
    {name}
    {disabled}
    bind:checked={value}
  >
    {label}
  </SlideToggle>
</label>
