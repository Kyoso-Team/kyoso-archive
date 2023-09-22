<script lang="ts">
  import isEqual from 'lodash.isequal';
  import { onMount } from 'svelte';
  import { SlideToggle } from '@skeletonlabs/skeleton';
  import { legacyForm } from '$stores';
  import type { Field, FormInputType } from '$types';

  export let key: string;
  export let type: Exclude<FormInputType, 'id'>;
  export let list: boolean | undefined = false;
  export let optional: boolean | undefined = false;
  let value: string | number | boolean | undefined = type === 'boolean' ? false : undefined;
  let errors: string[] = [];
  let disabled = false;
  let field: Field | undefined;

  onMount(() => {
    let defaultValue = $legacyForm?.defaultValue?.[key];

    if (list && Array.isArray(defaultValue) && defaultValue.length > 0) {
      value = defaultValue.reduce((str, value) => `${str},${value}`, '').substring(1);
    } else if (typeof defaultValue === 'string' && type === 'string') {
      value = defaultValue;
    } else if (typeof defaultValue === 'number' && type === 'number') {
      value = defaultValue;
    } else if (typeof defaultValue === 'boolean' && type === 'boolean') {
      value = defaultValue;
    }
  });

  $: {
    if ($legacyForm) {
      field = legacyForm.getFieldByKey($legacyForm, key);
    }
  }

  $: {
    let currentValue: typeof value | string[] | number[];

    if (list && typeof value === 'string') {
      let values = value
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value !== '');

      currentValue = type === 'number' ? values.map((value) => Number(value)) : values;
    } else if (
      (type === 'string' && value !== '') ||
      (type === 'number' && value !== null) ||
      type === 'boolean'
    ) {
      currentValue = value;
    }

    if (!isEqual($legacyForm?.currentValue[key], currentValue) && field) {
      if (field.validation && Array.isArray(currentValue)) {
        if (currentValue.length === 0 && !optional) {
          errors = ['This field is required'];
        } else {
          let individualErrors: string[] = [];

          currentValue.forEach((value, i) => {
            if (field?.validation) {
              let parsed = field.validation.safeParse(value);
              let errors = parsed.success
                ? []
                : parsed.error.issues.map(({ message }) => `${message} [on element: ${i + 1}]`);
              individualErrors.push(...errors);
            }
          });

          errors = individualErrors;
        }
      } else if (field.validation) {
        let parsed = field.validation.safeParse(currentValue);
        errors = parsed.success ? [] : parsed.error.issues.map(({ message }) => message);
      }

      legacyForm.setKeyValue(key, currentValue);
    }
  }

  $: {
    if ($legacyForm && field?.errorCount !== errors.length) {
      legacyForm.setFieldErrorCount(key, errors.length);
    }
  }

  $: {
    if (field?.disableIf && $legacyForm) {
      disabled = field.disableIf($legacyForm.currentValue);
    }
  }
</script>

<label class="label">
  {#if type === 'string' || type === 'number'}
    <span class={`duration-200 ${disabled ? 'opacity-70' : ''}`}>
      {field ? field.label : ''}<span class="text-error-600">{field?.optional ? '' : '*'}</span>
    </span>
    {#if type === 'number' && !list}
      <input
        type="number"
        step="any"
        class={`input ${errors.length > 0 ? 'input-error' : ''}`}
        {disabled}
        bind:value
      />
    {:else}
      {#if list}
        <span class="block text-sm text-gray-300"
          >Separate each value with a comma. (Example: value1,value2).</span
        >
      {/if}
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
