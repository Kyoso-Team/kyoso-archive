<script lang="ts">
  import isEqual from 'lodash.isequal';
  import { legacyForm } from '$stores';
  import { focusTrap } from '@skeletonlabs/skeleton';
  import { Input, InputSelect, InputSelectMulti } from '$components';

  let disabled = false;

  function onClose() {
    if ($legacyForm?.onClose) {
      $legacyForm.onClose();
    }

    legacyForm.destroy();
  }

  function onSubmit() {
    if (!$legacyForm) return;
    $legacyForm.onSubmit($legacyForm.currentValue);
    onClose();
  }

  $: {
    if ($legacyForm) {
      let hasErrors = !!$legacyForm.fields.find(({ errorCount }) => errorCount > 0);
      let isEmptyObject = Object.keys($legacyForm.currentValue).length === 0;
      let requiredFieldIsUndefined = !!$legacyForm.fields.find(({ optional, mapToKey, disableIf }) => {
        return !optional && $legacyForm?.currentValue && !disableIf?.($legacyForm.currentValue)
          ? $legacyForm?.currentValue?.[mapToKey] === undefined
          : false;
      });
      let isUnmodified = isEqual($legacyForm.currentValue, $legacyForm.defaultValue);
      let multiSelectDoesntHaveAtLeast = !!$legacyForm.fields.find(
        ({ mapToKey, disableIf, selectMultiple }) => {
          return (
            $legacyForm?.currentValue &&
            !disableIf?.($legacyForm.currentValue) &&
            typeof selectMultiple === 'object' &&
            (Array.isArray($legacyForm?.currentValue?.[mapToKey])
              ? ($legacyForm?.currentValue?.[mapToKey] as unknown[]).length
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

{#if $legacyForm}
  <form
    on:submit|preventDefault={onSubmit}
    use:focusTrap={true}
    class="h-screen max-h-screen w-[28rem] overflow-y-scroll bg-surface-800 p-6"
  >
    <header>
      <h2>{$legacyForm.title}</h2>
      {#if $legacyForm.description}
        <p>{$legacyForm.description}</p>
      {/if}
    </header>
    <div class="flex flex-col gap-4 py-8">
      {#each $legacyForm.fields as { mapToKey, multipleValues, type, values, selectMultiple, list, optional }}
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
      <button type="button" class="btn variant-ringed-primary" on:click={onClose}>Cancel</button>
    </div>
  </form>
{/if}
