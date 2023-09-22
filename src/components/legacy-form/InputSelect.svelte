<script lang="ts">
  import { onMount } from 'svelte';
  import { legacyForm } from '$stores';
  import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
  import type { Field } from '$types';

  export let key: string;
  export let type: 'string' | 'number';
  export let defaultValue:
    | {
        value: string | number;
        label: string;
      }
    | undefined;
  let value = defaultValue?.value;
  let disabled = false;
  let field: Field | undefined;

  onMount(() => {
    let defaultValue = $legacyForm?.defaultValue?.[key];

    if (
      (typeof defaultValue === 'string' && type === 'string') ||
      (typeof defaultValue === 'number' && type === 'number')
    ) {
      value = defaultValue;
    }
  });

  $: {
    if ($legacyForm) {
      field = legacyForm.getFieldByKey($legacyForm, key);
    }
  }

  $: {
    legacyForm.setKeyValue(key, value);
  }

  $: {
    if (field?.disableIf && $legacyForm) {
      disabled = field.disableIf($legacyForm.currentValue);
    }
  }
</script>

<label for="" class="label">
  <span class={`duration-200 ${disabled ? 'opacity-70' : ''}`}>
    {field ? field.label : ''}<span class="text-error-600">{field?.optional ? '' : '*'}</span>
  </span>
  <div class={`rounded-md bg-surface-700 p-2 duration-200 ${disabled ? 'opacity-70' : ''}`}>
    <ListBox padding="px-4 py-1">
      {#each field?.values || [] as fieldValue}
        <ListBoxItem
          name={`${$legacyForm?.title.toLowerCase().replaceAll(' ', '-')} ${field?.mapToKey}`}
          value={fieldValue.value}
          active={`duration-200 ${disabled ? '' : 'variant-filled-primary'}`}
          hover={disabled ? '' : 'hover:variant-soft-primary'}
          bind:group={value}
        >
          {fieldValue.label}
        </ListBoxItem>
      {/each}
    </ListBox>
  </div>
</label>
