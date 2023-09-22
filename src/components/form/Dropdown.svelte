<!-- <script lang="ts">
  import Errors from './Errors.svelte';
  import { onMount } from 'svelte';
  import { form } from '$stores';

  export let name: string;
  export let label: string;
  export let optional: boolean | undefined = false;
  export let defaultValue: string | null | undefined = undefined;
  export let value: string | null | undefined;
  export let disabled = false;
  let errors: string[] = [];
  let hasSelected = false;

  onMount(() => {
    if (defaultValue) {
      value = defaultValue;
    }
  });

  function onChange() {
    hasSelected = true;
  }

  function noInput(value: string | null | undefined) {
    return value === '' || value === null || value === undefined;
  }

  $: {
    if (hasSelected && !optional && noInput(value)) {
      errors = ['This field is required'];
    }
  }
</script>

<label class="label">
  <span class={`duration-200 ${disabled ? 'opacity-70' : ''}`}>
    {label}<span class="text-error-600">{optional ? '' : '*'}</span>
  </span>
  <slot />
  <select
    {name}
    class="select"
    on:change={onChange}
  >
    <option value="">None</option>
  </select>
  <input
    type="number"
    class={`input ${errors.length > 0 ? 'input-error' : ''}`}
    {disabled}
    on:input={onInput}
    bind:value
  />
  <Errors {errors} />
</label> -->
