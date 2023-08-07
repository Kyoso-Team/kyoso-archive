<script lang="ts">
  import isEqual from 'lodash.isequal';
  import { form } from '$stores';
  import { focusTrap } from '@skeletonlabs/skeleton';
  import { Input, InputSelect, InputSelectMulti } from '$components';

  let disabled = false;

  function onClose() {
    if ($form?.onClose) {
      $form.onClose();
    }

    form.destroy();
  }

  function onSubmit() {
    if (!$form) return;
    $form.onSubmit($form.currentValue);
    onClose();
  }

  $: {
    if ($form) {
      let hasErrors = !!$form.fields.find(({ errorCount }) => errorCount > 0);
      let isEmptyObject = Object.keys($form.currentValue).length === 0;
      let requiredFieldIsUndefined = !!$form.fields.find(({ optional, mapToKey, disableIf }) => {
        return !optional && $form?.currentValue && !disableIf?.($form.currentValue)
          ? $form?.currentValue?.[mapToKey] === undefined
          : false;
      });
      let isUnmodified = isEqual($form.currentValue, $form.defaultValue);
      let multiSelectDoesntHaveAtLeast = !!$form.fields.find(
        ({ mapToKey, disableIf, selectMultiple }) => {
          return (
            $form?.currentValue &&
            !disableIf?.($form.currentValue) &&
            typeof selectMultiple === 'object' &&
            (Array.isArray($form?.currentValue?.[mapToKey])
              ? ($form?.currentValue?.[mapToKey] as unknown[]).length
              : 0) <= selectMultiple.atLeast
          );
        }
      );

      disabled =
        hasErrors ||
        isEmptyObject ||
        requiredFieldIsUndefined ||
        isUnmodified ||
        multiSelectDoesntHaveAtLeast;
    }
  }
</script>

{#if $form}
  <form
    on:submit|preventDefault={onSubmit}
    use:focusTrap={true}
    class="h-screen max-h-screen w-[28rem] overflow-y-scroll bg-surface-800 p-6"
  >
    <header>
      <h2>{$form.title}</h2>
      {#if $form.description}
        <p>{$form.description}</p>
      {/if}
    </header>
    <div class="flex flex-col gap-4 py-8">
      {#each $form.fields as { mapToKey, multipleValues, type, values, selectMultiple, list, optional }}
        {#if multipleValues && (type === 'string' || type === 'number')}
          {#if selectMultiple}
            <InputSelectMulti key={mapToKey} />
          {:else}
            <InputSelect {type} key={mapToKey} defaultValue={values?.[0]} />
          {/if}
        {:else if type === 'string' || type === 'number' || type === 'boolean'}
          <Input {type} key={mapToKey} {list} {optional} />
        {/if}
      {/each}
    </div>
    <div class="flex gap-2">
      <button type="submit" class="btn variant-filled-primary cursor-pointer" {disabled}
        >Submit</button
      >
      <button type="button" class="variant-ringed-primary btn" on:click={onClose}>Cancel</button>
    </div>
  </form>
{/if}
