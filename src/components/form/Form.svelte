<script lang="ts">
  import isEqual from 'lodash.isequal';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { invalidateAll } from '$app/navigation';
  import { showFormError as showFormErrorUtil } from '$lib/utils';
  import { form, error } from '$stores';
  import { focusTrap } from '@skeletonlabs/skeleton';
  import type { FormSubmit } from '$types';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let submit: FormSubmit<any, any>;
  export let value: Record<string, unknown>;
  let disabled = false;

  function onCloseBtnClick() {
    if ($form.onClose) {
      $form.onClose();
    }

    form.destroy();
  }

  async function onSubmitBtnClick() {
    await onSubmit();
    onCloseBtnClick();
  }

  function showFormError(options: {
    message: string;
    value: Record<string, unknown>;
  }) {
    showFormErrorUtil({
      message: options.message,
      reopenForm: () => {
        if ($form.onFormReopen) {
          $form.onFormReopen(options.value);
        }
      }
    });
  }

  async function onSubmit() {
    try {
      await submit(value, {
        trpc,
        invalidateAll,
        showFormError,
        page: $page,
        ctx: $form.context
      });

      if ($form.afterSubmit) {
        await $form.afterSubmit(value);
      }
    } catch(err) {
      console.error(err);
      error.set($error, err, 'close');
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
  <div class="flex gap-2">
    <button
      type="submit"
      class="btn variant-filled-primary cursor-pointer"
      {disabled}
    >Submit</button>
    <button type="button" class="btn variant-ringed-primary" on:click={onCloseBtnClick}>Cancel</button>
  </div>
</form>