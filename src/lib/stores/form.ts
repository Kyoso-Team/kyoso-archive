import * as v from 'valibot';
import { writable } from 'svelte/store';

export function createForm<
  TSchema extends Record<string, v.BaseSchema>,
  TFinalValue = { [K in keyof TSchema]: v.Output<TSchema[K]> },
  TLiveValue = {
    [K in keyof TFinalValue]: TFinalValue[K] extends boolean
      ? TFinalValue[K]
      : TFinalValue[K] | undefined;
  }
>(formSchema: TSchema, defaults?: { [K in keyof TFinalValue]?: TFinalValue[K] } | null) {
  const labels: Record<string, string> = {};
  const value: Record<string, any> = {};
  defaults ||= {};

  for (const key in formSchema) {
    const schema = formSchema[key];

    // Make boolean fields default to false instead of null
    if (((schema as any)?.type === 'boolean' || (schema as any)?.wrapped?.type === 'boolean') && (defaults as any)[key] === undefined) {
      (defaults as any)[key] = false;
    }
    
    value[key] = (defaults as any)?.[key];
    labels[key] = key;
  }

  const form = writable<{
    value: TLiveValue;
    defaults: { [K in keyof TFinalValue]?: TFinalValue[K] };
    errors: { [K in keyof TFinalValue]?: string };
    updated: { [K in keyof TFinalValue]?: true };
    canSubmit: boolean;
    hasUpdated: boolean;
  }>({
    errors: {},
    updated: {},
    canSubmit: false,
    hasUpdated: false,
    defaults: (defaults || {}) as any,
    value: value as any
  });

  function canSubmit(form: { value: TLiveValue; errors: { [K in keyof TFinalValue]?: string }; }) {
    const { value, errors } = form;
    const parsed = v.safeParse(v.object(formSchema), value);
    const hasErrors = Object.values(errors).filter((err) => typeof err === 'string').length > 0;
    return parsed.success && !hasErrors;
  }

  function hasUpdated(form: { updated: { [K in keyof TFinalValue]?: true }; }) {
    return Object.values(form.updated).length > 0;
  }

  function setValue(key: string, input: any) {
    form.update((form) => {
      const value = form.value as Record<string, any>;
      const defaults = form.defaults as Record<string, any>;
      const errors = form.errors as Record<string, string | undefined>;
      const updated = form.updated as Record<string, true | undefined>;
      const parsed = v.safeParse(formSchema[key], input);

      if (parsed.success) {
        errors[key] = undefined;
      } else {
        errors[key] = v.flatten(parsed.issues).root?.[0];
      }

      if (input === defaults[key]) {
        delete updated[key];
      } else {
        updated[key] = true;
      }

      value[key] = input;

      const newForm = {
        value,
        errors,
        updated,
        defaults
      } as any;

      return {
        ...newForm,
        canSubmit: canSubmit(newForm),
        hasUpdated: hasUpdated(newForm)
      };
    });
  }

  function setGlobalError(err: string) {
    form.update((form) => {
      const errors = form.errors as Record<string, string | undefined>;
      errors['global'] = err;

      const newForm = {
        errors,
        value: form.value,
        updated: form.updated,
        defaults: form.defaults
      } as any;

      return {
        ...newForm,
        canSubmit: canSubmit(newForm)
      };
    });
  }

  function overrideInitialValues(newDefaults: { [K in keyof TFinalValue]?: TFinalValue[K] }) {
    form.update((form) => {
      const defaults: Record<string, any> = {};
      const value = form.value as Record<string, any>;
      const updated = form.updated as Record<string, true | undefined>;

      for (const key in formSchema) {
        const schema = formSchema[key];
    
        // Make boolean fields default to false instead of null
        if (((schema as any)?.type === 'boolean' || (schema as any)?.wrapped?.type === 'boolean') && (newDefaults as any)[key] === undefined) {
          defaults[key] = false;
        } else {
          defaults[key] = (newDefaults as any)[key];
        }

        if (value[key] === defaults[key]) {
          delete updated[key];
        } else {
          updated[key] = true;
        }
      }


      const newForm = {
        ...form,
        updated,
        defaults
      } as any;

      return {
        ...newForm,
        canSubmit: canSubmit(newForm),
        hasUpdated: hasUpdated(newForm)
      } as any;
    });
  }

  function getFinalValue<UpdatedOnly extends boolean = false>(form: {
    value: TLiveValue;
    updated: { [K in keyof TFinalValue]?: true };
    errors: { [K in keyof TFinalValue]?: string };
  }, options?: { updatedFieldsOnly?: UpdatedOnly }): UpdatedOnly extends true ? Partial<TFinalValue> : TFinalValue {
    const { value, errors, updated } = form;
    const parsed = v.safeParse(v.object(formSchema), value);

    if (!parsed.success) {
      throw Error("Can't retrieve value for submission because the value is invalid");
    }

    const hasErrors = Object.values(errors).filter((err) => typeof err === 'string').length > 0;

    if (hasErrors) {
      throw Error(
        "Can't retrieve value for submission because the form has errors that need to be resolved"
      );
    }

    if (options?.updatedFieldsOnly) {
      return Object.fromEntries(Object.entries(parsed.output).filter((entry) => (updated as any)[entry[0]])) as any;
    }

    return value as any;
  }

  return {
    ...form,
    setValue,
    getFinalValue,
    setGlobalError,
    overrideInitialValues,
    labels: labels as { [K in keyof TFinalValue]: K },
    schemas: formSchema
  };
}
