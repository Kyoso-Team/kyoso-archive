import { writable } from 'svelte/store';
import * as v from 'valibot';
import { arraysHaveSameElements } from '$lib/utils';
import type { AnyForm } from '$lib/types';

function setTrueOrDeleteKey(obj: Record<string, any>, key: string, condition: boolean) {
  if (condition) {
    obj[key] = true;
  } else {
    delete obj[key];
  }
  return obj;
}

function setKey(obj: Record<string, any>, key: string, value: any) {
  obj[key] = value;
  return obj;
}

function isEqual(a: any, b: any) {
  return (
    a === b ||
    ((a === null || a === undefined) && (b === null || b === undefined)) ||
    (a instanceof Date && b instanceof Date && a.getTime() === b.getTime()) ||
    (Array.isArray(a) && Array.isArray(b) && arraysHaveSameElements(a, b))
  );
}

function isSchemaType(schema: v.GenericSchema, type: string) {
  return schema.type === type || (schema as v.OptionalSchema<any, any>)?.wrapped?.type === type;
}

function formInit(
  formSchema: Record<string, v.GenericSchema>,
  defaultValue: Record<string, any> | undefined | null
) {
  const labels: Record<string, string> = {};
  const value: Record<string, any> = {};
  const defaults: Record<string, any> = defaultValue || {};
  let updated: Partial<Record<string, true>> = {};

  for (const key in formSchema) {
    defaults[key] = defaults[key] === undefined ? null : defaults[key];

    // Make boolean fields default to false instead of null and array fields default to []
    if (defaults[key] === null) {
      if (isSchemaType(formSchema[key], 'boolean')) {
        defaults[key] = false;
      }

      if (isSchemaType(formSchema[key], 'array')) {
        defaults[key] = [];
      }
    }

    value[key] = defaults[key];
    labels[key] = key;
    updated = setTrueOrDeleteKey(updated, key, !isEqual(defaults[key], value[key]));
  }

  return { labels, value, updated };
}

function canSubmit(
  formSchema: Record<string, v.GenericSchema>,
  form: Pick<AnyForm, 'value' | 'errors'>
) {
  const { value, errors } = form;
  const parsed = v.safeParse(v.object(formSchema), value);
  const hasErrors = Object.values(errors).filter((err) => typeof err === 'string').length > 0;
  return parsed.success && !hasErrors;
}

function hasUpdated(form: Pick<AnyForm, 'updated'>) {
  return Object.values(form.updated).length > 0;
}

export function createForm<
  TSchema extends Record<string, v.GenericSchema>,
  TFinalValue = { [K in keyof TSchema]: v.InferOutput<TSchema[K]> },
  TLiveValue = {
    [K in keyof TFinalValue]: TFinalValue[K] extends boolean | any[]
      ? TFinalValue[K]
      : TFinalValue[K] | null;
  }
>(
  formSchema: TSchema,
  defaults?: { [K in keyof TSchema]?: v.InferOutput<TSchema[K]> | null } | null
) {
  const { labels, value } = formInit(formSchema, defaults);
  const form = writable<{
    value: TLiveValue;
    errors: { [K in keyof TFinalValue]?: string };
    updated: { [K in keyof TFinalValue]?: true };
    overwritten: { [K in keyof TFinalValue]?: true };
    defaults: { [K in keyof TFinalValue]?: TFinalValue[K] | null };
    canSubmit: boolean;
    hasUpdated: boolean;
  }>({
    errors: {},
    updated: {},
    overwritten: {},
    canSubmit: false,
    hasUpdated: false,
    defaults: (defaults || {}) as any,
    value: value as any
  });

  function reset() {
    form.update(({ defaults }) => {
      const { value } = formInit(formSchema, defaults);
      const newForm = {
        value,
        defaults,
        errors: {},
        updated: {},
        overwritten: Object.keys(formSchema).reduce((obj, key) => ({ ...obj, [key]: true }), {})
      } as Omit<AnyForm, 'canSubmit' | 'hasUpdated'>;

      return {
        ...newForm,
        canSubmit: canSubmit(formSchema, newForm),
        hasUpdated: hasUpdated(newForm)
      } as any;
    });
  }

  function setOverwrittenState(key: string, state: boolean) {
    form.update((form) => ({
      ...form,
      overwritten: setTrueOrDeleteKey(form.overwritten, key, state)
    }));
  }

  function setValue(key: string, input: any) {
    form.update(({ defaults, errors, overwritten, updated, value }) => {
      const parsed = v.safeParse(formSchema[key], input);
      const newForm = {
        defaults,
        overwritten,
        errors: setKey(
          errors,
          key,
          parsed.success ? undefined : v.flatten(parsed.issues).root?.[0]
        ),
        updated: setTrueOrDeleteKey(updated, key, !isEqual(input, (defaults as any)[key])),
        value: setKey(value as any, key, input)
      } as Omit<AnyForm, 'canSubmit' | 'hasUpdated'>;

      return {
        ...newForm,
        canSubmit: canSubmit(formSchema, newForm),
        hasUpdated: hasUpdated(newForm)
      } as any;
    });
  }

  function overrideInitialValues(newDefaults: {
    [K in keyof TFinalValue]?: TFinalValue[K] | null;
  }) {
    form.update(({ errors, overwritten }) => {
      const { value, updated } = formInit(formSchema, newDefaults);
      const newForm = {
        updated,
        overwritten,
        errors,
        value,
        defaults: newDefaults
      } as AnyForm;

      return {
        ...newForm,
        canSubmit: canSubmit(formSchema, newForm),
        hasUpdated: hasUpdated(newForm)
      } as any;
    });
  }

  function getFinalValue<UpdatedOnly extends boolean = false>(
    form: {
      value: TLiveValue;
      updated: { [K in keyof TFinalValue]?: true };
      errors: { [K in keyof TFinalValue]?: string };
    },
    options?: { updatedFieldsOnly?: UpdatedOnly }
  ): UpdatedOnly extends true ? Partial<TFinalValue> : TFinalValue {
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

    return options?.updatedFieldsOnly
      ? (Object.fromEntries(
          Object.entries(parsed.output).filter((entry) => (updated as any)[entry[0]])
        ) as any)
      : (value as any);
  }

  return {
    ...form,
    reset,
    setValue,
    getFinalValue,
    overrideInitialValues,
    setOverwrittenState,
    labels: labels as { [K in keyof TFinalValue]: K },
    schemas: formSchema
  };
}
