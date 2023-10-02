import { writable } from 'svelte/store';
import type { MaybePromise } from '@sveltejs/kit';
import type { FormRegistry } from '$forms';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormComponent = any;

function createForm() {
  const blank = {
    component: undefined,
    errorCounts: {},
    context: {},
    requiredFields: [],
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onSubmit: () => {}
  };

  const { subscribe, set, update } = writable<{
    component: FormComponent;
    errorCounts: Record<string, number>;
    requiredFields: string[];
    onFormReopen?: (value: Record<string, unknown>) => void;
    context: Record<string, unknown>;
    defaultValue?: Record<string, unknown>;
    onClose?: () => MaybePromise<void>;
    afterSubmit?: (value: Record<string, unknown>) => MaybePromise<void>;
  }>(blank);

  /**
   * Mount a form component
   * @param component The component to mount as a form (components within the `$forms` path alias) 
   * @param options Additional options and configuration
   */
  function create<
    FormComponent,
    SubmitValue extends Record<string, unknown>,
    DefaultValue extends Record<string, unknown> | undefined,
    Ctx extends Record<string, unknown> | undefined
  >(component: FormComponent, options: {
    /**
     * The default value for the form
     */
    defaultValue?: DefaultValue;
    /**
     * Function to execute upon closing the form (executes upon cancelling the form and after `onSubmit` in if does get submitted)
     */
    onClose?: () => MaybePromise<void>;
    /**
     * Additional context to pass to the form
     */
    context?: Ctx;
    /**
     * Function to execute upon closing an eror and reopening the form
     */
    onFormReopen?: (value: SubmitValue) => void;
    /**
     * Function to execute after the `submit` function executes successfully
     */
    afterSubmit?: (value: SubmitValue) => MaybePromise<void>;
  }) {
    let { onFormReopen, afterSubmit, defaultValue, onClose, context } = options;

    update((current) => {
      current = {
        ... current,
        component,
        defaultValue,
        onClose,
        context: context || {},
        afterSubmit: afterSubmit as (value: Record<string, unknown>) => MaybePromise<void>,
        onFormReopen: onFormReopen as (value: Record<string, unknown>) => void
      };

      return Object.assign({}, current);
    });
  }

  /**
   * Unmounts the active form component
   */
  function destroy() {
    set(blank);
  }

  /**
   * Set the amount of errors found within a field due to validation
   * @param fieldKey The key (name) of the field to use as reference
   * @param errorCount The amount of errors found
   */
  function setFieldErrorCount(fieldKey: string, errorCount: number) {
    update((current) => {
      current.errorCounts[fieldKey] = errorCount;
      return Object.assign({}, current);
    });
  }

  const init = new Proxy({} as FormRegistry, {
    get () {
      return create;
    }
  });

  return {
    subscribe,
    destroy,
    setFieldErrorCount,
    init
  };
}

/**
 * Store used to handle dynamic forms
 */
export const form = createForm();
