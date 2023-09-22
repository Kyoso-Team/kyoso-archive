<script lang="ts">
  import Errors from './Errors.svelte';
  import { onMount } from 'svelte';
  import { form } from '$stores';
  import type { ZodNumber } from 'zod';

  export let name: string;
  export let label: string;
  export let optional: boolean | undefined = false;
  export let defaultValue: number | null | undefined = undefined;
  export let value: number | null | undefined;
  export let schema: ZodNumber;
  export let disabled = false;
  let errors: string[] = [];
  let hasWritten = false;

  onMount(() => {
    if (defaultValue) {
      value = defaultValue;
    }
  });

  function onInput() {
    hasWritten = true;
  }

  function noInput(value: number | null | undefined) {
    return isNaN(value || 0) || value === null || value === undefined;
  }

  $: {
    if (hasWritten) {
      if (!optional && noInput(value)) {
        errors = ['This field is required'];
      } else if (schema) {
        let parsed = schema.safeParse(value);
        errors = parsed.success ? [] : parsed.error.issues.map(({ message }) => message);
      }
    }
  }

  $: {
    form.setFieldErrorCount(name, errors.length);
  }
</script>

<label class="label">
  <span class={`duration-200 ${disabled ? 'opacity-70' : ''}`}>
    {label}<span class="text-error-600">{optional ? '' : '*'}</span>
  </span>
  <slot />
  <input
    type="number"
    class={`input ${errors.length > 0 ? 'input-error' : ''}`}
    {disabled}
    on:input={onInput}
    bind:value
  />
  <Errors {errors} />
</label>
