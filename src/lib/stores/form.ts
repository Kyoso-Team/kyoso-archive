import { writable } from 'svelte/store';
import { ZodEffects, ZodOptional, z } from 'zod';
import type { Field, FormInputType, MapResult, AssignFieldType } from '$types';
import type { ZodString, ZodNumber, ZodBoolean, ZodDate, ZodAny } from 'zod';

function createForm() {
  const { subscribe, set, update } = writable<
    | {
        title: string;
        fields: Field[];
        description?: string;
        defaultValue?: Record<string, unknown>;
        currentValue: Record<string, unknown>;
        onSubmit: (value: Record<string, unknown>) => void | Promise<void>;
        onClose?: () => void | Promise<void>;
      }
    | undefined
  >();

  function create<T extends Record<string, unknown>>({
    title,
    fields,
    onSubmit,
    defaultValue,
    description,
    onClose
  }: {
    title: string;
    fields: (createField: { field: typeof field; asyncField: typeof asyncField }) => Field[];
    onSubmit: (value: T) => void | Promise<void>;
    onClose?: () => void | Promise<void>;
    defaultValue?: T;
    description?: string;
  }) {
    function field<
      I extends FormInputType,
      K extends keyof T,
      Z extends AssignFieldType<T, K, ZodString, ZodNumber, ZodBoolean, ZodDate, ZodAny>
    >(
      label: string,
      mapToKey: K,
      type: AssignFieldType<
        T,
        K,
        'string',
        'number',
        'boolean',
        'date',
        Exclude<FormInputType, 'id'>
      >,
      options?: I extends 'string' | 'number'
        ? {
            validation?: (z: Z) => Z | ZodOptional<Z> | ZodEffects<Z, unknown, unknown>;
            disableIf?: (currentValue: Partial<T>) => boolean;
            optional?: boolean;
            fromValues?: {
              values: () => I extends 'string' ? string[] : number[];
              selectMultiple?: boolean;
            };
          }
        : undefined
    ): Field {
      let err = {
        required_error: 'This field is required'
      };

      let schema =
        type === 'string'
          ? z.string(err)
          : type === 'number'
          ? z.number(err)
          : type === 'boolean'
          ? z.boolean(err)
          : z.date(err);

      return {
        validation: options?.validation?.(
          (options.optional ? schema.optional() : schema) as Z
        ) as ZodString,
        disableIf: options?.disableIf as
          | ((currentValue: Record<string, unknown>) => boolean)
          | undefined,
        mapToKey: mapToKey as string,
        optional: options?.optional,
        errorCount: 0,
        multipleValues: !!options?.fromValues,
        values: options?.fromValues?.values() || [],
        selectMultiple: options?.fromValues?.selectMultiple,
        label,
        type
      };
    }

    function asyncField<I extends Record<string, unknown>>(
      label: string,
      mapToKey: keyof T,
      onSearch: () => Promise<Record<string, unknown>>,
      mapResult: {
        label: (result: I) => string;
        imgRef?: (result: I) => string;
      },
      optional?: boolean
    ): Field {
      return {
        values: [],
        type: 'id',
        mapToKey: mapToKey as string,
        mapResult: mapResult as MapResult,
        errorCount: 0,
        optional,
        label,
        onSearch
      };
    }

    set({
      title,
      defaultValue,
      description,
      onClose,
      currentValue: {},
      onSubmit: onSubmit as (value: Record<string, unknown>) => void | Promise<void>,
      fields: fields({
        field,
        asyncField
      })
    });
  }

  function destroy() {
    set(undefined);
  }

  function setKeyValue(key: string, value: unknown) {
    update((current) => {
      if (current) {
        current.currentValue[key] = value;
      }

      return Object.assign({}, current);
    });
  }

  function getFieldByKey(
    form: {
      title: string;
      fields: Field[];
    },
    key: string
  ): Field {
    let field = form.fields.find(({ mapToKey }) => mapToKey === key);

    if (!field) {
      throw new Error(`Can't find field with key "${key}" inside form titled "${form.title}`);
    }

    return field;
  }

  function setFieldErrorCount(fieldKey: string, errCount: number) {
    update((current) => {
      if (current) {
        let field = current.fields.find(({ mapToKey }) => mapToKey === fieldKey);

        if (!field) {
          throw new Error(
            `Can't find field with key "${fieldKey}" inside form titled "${current.title}`
          );
        }

        field.errorCount = errCount;
      }

      return Object.assign({}, current);
    });
  }

  return {
    subscribe,
    create,
    destroy,
    setKeyValue,
    getFieldByKey,
    setFieldErrorCount
  };
}

export const form = createForm();
