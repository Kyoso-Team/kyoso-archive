<script lang="ts">
  import { onMount } from 'svelte';
  import { SlideToggle } from '@skeletonlabs/skeleton';
  import { form } from '$stores';
  import type { Field, FormInputType } from '$types';

  export let key: string;
  export let type: Exclude<FormInputType, 'id'>;
  let value: string | number | boolean | undefined = type === 'boolean' ? false : undefined;
  let errors: string[] = [];
  let disabled = false;
  let field: Field | undefined;

  onMount(() => {
    let defaultValue = $form?.defaultValue?.[key];

    if (typeof defaultValue === 'string' && type === 'string') {
      value = defaultValue;
    } else if (typeof defaultValue === 'number' && type === 'number') {
      value = defaultValue;
    } else if (typeof defaultValue === 'boolean' && type === 'boolean') {
      value = defaultValue;
    }
  });

  $: {
    if ($form) {
      field = form.getFieldByKey($form, key);
    }
  }

  $: {
    let currentValue =
      type === 'string'
        ? value === ''
          ? undefined
          : value
        : type === 'number'
        ? value === null
          ? undefined
          : value
        : value;

    if ($form?.currentValue[key] !== currentValue && field) {
      if (field.validation) {
        let parsed = field.validation.safeParse(currentValue);
        errors = parsed.success ? [] : parsed.error.issues.map(({ message }) => message);
      }

      form.setKeyValue(key, currentValue);
    }
  }

  $: {
    if ($form && field?.errorCount !== errors.length) {
      form.setFieldErrorCount(key, errors.length);
    }
  }

  $: {
    if (field?.disableIf && $form) {
      disabled = field.disableIf($form.currentValue);
    }
  }
</script>

<label class="label">
  {#if type === 'string' || type === 'number'}
    <span class={`duration-200 ${disabled ? 'opacity-70' : ''}`}>
      {field ? field.label : ''}<span class="text-error-600">{field?.optional ? '' : '*'}</span>
    </span>
    {#if type === 'number'}
      <input
        type="number"
        class={`input ${errors.length > 0 ? 'input-error' : ''}`}
        {disabled}
        bind:value
      />
    {:else}
      <input
        type="text"
        class={`input ${errors.length > 0 ? 'input-error' : ''}`}
        {disabled}
        bind:value
      />
    {/if}
    {#if errors.length === 1}
      <span class="text-sm text-error-600">{errors[0]}</span>
    {:else if errors.length > 1}
      <ol class="text-sm text-error-600">
        {#each errors as err, i}
          <li>{i + 1}. {err}</li>
        {/each}
      </ol>
    {/if}
  {:else if type === 'boolean' && typeof value === 'boolean'}
    <input type="checkbox" class="hidden" />
    <SlideToggle
      name={field ? field.label : ''}
      active="bg-primary-500"
      {disabled}
      bind:checked={value}
    >
      {field ? field.label : ''}
    </SlideToggle>
  {/if}
</label>
