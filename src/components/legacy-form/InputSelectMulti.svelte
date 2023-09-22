<script lang="ts">
  import { onMount } from 'svelte';
  import { legacyForm } from '$stores';
  import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
  import type { Field } from '$types';

  export let key: string;
  let values: (string | number)[] = [];
  let disabled = false;
  let field: Field | undefined;

  onMount(() => {
    let defaultValues = $legacyForm?.defaultValue?.[key];

    if (Array.isArray(defaultValues)) {
      values = defaultValues;
    }
  });

  $: {
    if ($legacyForm) {
      field = legacyForm.getFieldByKey($legacyForm, key);
    }
  }

  $: {
    legacyForm.setKeyValue(key, values);
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
    <ListBox padding="px-4 py-1" multiple>
      {#each field?.values || [] as fieldValue}
        <ListBoxItem
          name={`${$legacyForm?.title.toLowerCase().replaceAll(' ', '-')} ${field?.mapToKey}`}
          value={fieldValue.value}
          active={`duration-200 ${disabled ? '' : 'variant-filled-primary'}`}
          hover={disabled ? '' : 'hover:variant-soft-primary'}
          bind:group={values}
        >
          {fieldValue.label}
        </ListBoxItem>
      {/each}
    </ListBox>
  </div>
</label>
