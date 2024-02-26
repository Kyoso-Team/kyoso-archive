import * as v from 'valibot';
import { writable } from 'svelte/store';

export function createForm<
  TSchema extends Record<string, v.BaseSchema>,
  TFinalValue = { [K in keyof TSchema]: v.Output<TSchema[K]>; },
  TLiveValue = {
    [K in keyof TFinalValue]: TFinalValue[K] extends boolean ? TFinalValue[K] : TFinalValue[K] | undefined;
  },
>(formSchema: TSchema, defaults?: { [K in keyof TFinalValue]?: TFinalValue[K]; }) {
  const labels: Record<string, string> = {};
  const value: Record<string, any> = {};
  const errors: Record<string, string | undefined> = {};

  for (const key in formSchema) {
    const schema = formSchema[key];

    // Make boolean fields default to false instead of null
    if ((schema as any)?.type === 'boolean' || (schema as any)?.wrapped?.type === 'boolean') {
      value[key] = false;
    }

    const defaultValue = defaults?.[key as unknown as keyof typeof defaults];

    if (defaultValue !== undefined) {
      value[key] = defaultValue;
    }

    labels[key] = key;
  }

  const form = writable<{
    value: TLiveValue;
    errors: { [K in keyof TFinalValue]?: string; };
    canSubmit: boolean;
  }>({
    errors,
    canSubmit: false,
    value: value as any
  });

  function canSubmit(form: {
    value: TLiveValue;
    errors: { [K in keyof TFinalValue]?: string; };
  }) {
    const { value, errors } = form;
    const parsed = v.safeParse(v.object(formSchema), value);
    const hasErrors = Object.values(errors).filter((err) => typeof err === 'string').length > 0;
    return parsed.success && !hasErrors;
  }

  function setValue(key: string, input: any) {
    form.update((form) => {
      const value = form.value as Record<string, any>;
      const errors = form.errors as Record<string, string | undefined>;
      const parsed = v.safeParse(formSchema[key], input);

      if (parsed.success) {
        errors[key] = undefined;
      } else {
        errors[key] = v.flatten(parsed.issues).root?.[0];
      }

      value[key] = input;

      const newForm = {
        value,
        errors
      } as any;

      return {
        ...newForm,
        canSubmit: canSubmit(newForm)
      };
    });
  }

  function setGlobalError(err: string) {
    form.update((form) => {
      const errors = form.errors as Record<string, string | undefined>;
      errors['global'] = err;

      const newForm = {
        errors,
        value: form.value
      } as any;

      return {
        ...newForm,
        canSubmit: canSubmit(newForm)
      };
    });
  }

  function getFinalValue(form: {
    value: TLiveValue;
    errors: { [K in keyof TFinalValue]?: string; };
  }): TFinalValue {
    const { value, errors } = form;
    const parsed = v.safeParse(v.object(formSchema), value);
    
    if (!parsed.success) {
      throw Error('Can\'t retrieve value for submission because the value is invalid');
    }

    const hasErrors = Object.values(errors).filter((err) => typeof err === 'string').length > 0;

    if (hasErrors) {
      throw Error('Can\'t retrieve value for submission because the form has errors that need to be resolved');
    }

    return value as any;
  }

  return {
    ...form,
    setValue,
    getFinalValue,
    setGlobalError,
    labels: labels as { [K in keyof TFinalValue]: K; },
    schemas: formSchema
  };
}
