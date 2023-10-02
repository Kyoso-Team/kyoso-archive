<script lang="ts">
  import isEqual from 'lodash.isequal';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { invalidateAll } from '$app/navigation';
  import { form, error } from '$stores';
  import { focusTrap } from '@skeletonlabs/skeleton';
  import { FormError } from '$classes';
  import { X } from 'lucide-svelte';
  import type { FormSubmit } from '$types';

  const submitUtils = {
    trpc,
    invalidateAll,
    page: $page,
    ctx: $form.context
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let submit: FormSubmit<any, any>;
  export let value: Record<string, unknown>;
  let currentError = '';
  let disabled = false;

  function onCloseBtnClick() {
    if ($form.onClose) {
      $form.onClose();
    }

    form.destroy();
  }

  async function onSubmitBtnClick() {
    const { close } = await onSubmit();

    if (close) {
      onCloseBtnClick();
    }
  }

  async function onSubmit(): Promise<{ close: boolean }> {
    try {
      await submit(value, submitUtils);

      if ($form.afterSubmit) {
        await $form.afterSubmit(value);
      }

      return { close: true };
    } catch(err) {
      if (err instanceof FormError) {
        currentError = err.message;
        return { close: false };
      }

      console.error(err);
      error.set($error, err, 'close');
      return { close: true };
    }
  }

  $: {
    let errorCount = Object.values($form?.errorCounts || {}).reduce((total, value) => total + value, 0);
    let hasErrors = errorCount > 0;

    let requiredFieldIsUndefined = false;

    for (let key in value) {
      let isFieldRequired = $form.requiredFields.includes(key);
      let isValueNullish = value[key] === undefined || value[key] === null;
      requiredFieldIsUndefined = isFieldRequired && isValueNullish;
    }

    let isUnmodified = isEqual(value, $form.defaultValue);
    let isEmptyObject = Object.keys(value).length === 0;

    disabled =
      hasErrors ||
      isEmptyObject ||
      requiredFieldIsUndefined ||
      isUnmodified;
  }
</script>

<form
  on:submit|preventDefault={onSubmitBtnClick}
  use:focusTrap={true}
  class="h-screen max-h-screen w-[28rem] overflow-y-scroll bg-surface-800 p-6"
>
  <header>
    <slot name="header" />
  </header>
  <div class="flex flex-col gap-4 py-8">
    <slot />
  </div>
  {#if currentError}
    <div class="bg-error-500/10 border border-error-500/30 rounded-md p-2 mb-8">
      <div class="flex gap-1 items-center">
        <X class="stroke-error-500 w-6 h-6" />
        <span class="block text-error-500 font-medium">Form submission error</span>
      </div>
      <span class="block mt-2 text-sm px-1">{currentError}</span>
    </div>
  {/if}
  <div class="flex gap-2">
    <button
      type="submit"
      class="btn variant-filled-primary cursor-pointer"
      {disabled}
    >Submit</button>
    <button type="button" class="btn variant-ringed-primary" on:click={onCloseBtnClick}>Cancel</button>
  </div>
</form>