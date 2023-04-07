<script lang="ts">
  import { onMount } from 'svelte';
  import { form } from '$stores';
  import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
  import type { Field } from '$types';

  export let key: string;
  export let type: 'string' | 'number';
  export let defaultValue: string | number | undefined;
  let value = defaultValue;
  let disabled = false;
  let field: Field | undefined;

  onMount(() => {
    let defaultValue = $form?.defaultValue?.[key];

    if (typeof defaultValue === 'string' && type === 'string') {
      value = defaultValue;
    } else if (typeof defaultValue === 'number' && type === 'number') {
      value = defaultValue;
    }
  });

  $: {
    if ($form) {
      field = form.getFieldByKey($form, key);
    }
  }

  $: {
    form.setKeyValue(key, value);
  }

  $: {
    if (field?.disableIf && $form) {
      disabled = field.disableIf($form.currentValue);
    }
  }
</script>

<label for="" class="label">
  <span class={`duration-200 ${disabled ? 'opacity-70' : ''}`}>
    {field ? field.label : ''}<span class="text-error-600">{field?.optional ? '' : '*'}</span>
  </span>
  <div class="rounded-md bg-surface-700 p-2">
    <ListBox active="variant-filled-primary" padding="px-4 py-1" hover="hover:variant-soft-primary">
      {#each field?.values || [] as fieldValue}
        <ListBoxItem
          name={`${$form?.title.toLowerCase().replaceAll(' ', '-')} ${field?.mapToKey}`}
          value={fieldValue}
          bind:group={value}
        >
          {fieldValue.toString()}
        </ListBoxItem>
      {/each}
    </ListBox>
  </div>
</label>
