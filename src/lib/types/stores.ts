import type { Writable } from 'svelte/store';
import type { BaseSchema } from 'valibot';

export type AnyForm = {
  value: Record<string, any>;
  errors: Partial<Record<string, string>>;
  updated: Partial<Record<string, true>>;
  overwritten: Partial<Record<string, true>>;
  defaults: Record<string, any>;
  canSubmit: boolean;
  hasUpdated: boolean;
};

export type FormStore = Writable<AnyForm> & {
  reset: () => void;
  setValue: (key: string, input: any) => void;
  getFinalValue: <UpdatedOnly extends boolean = false>(
    form: Pick<Record<string, any>, 'value' | 'updated' | 'errors'>,
    options?:
      | {
          updatedFieldsOnly?: UpdatedOnly | undefined;
        }
      | undefined
  ) => UpdatedOnly extends true ? Partial<Record<string, any>> : Record<string, any>;
  overrideInitialValues: (newDefaults: Record<string, any>) => void;
  setOverwrittenState: (key: string, state: boolean) => void;
  schemas: Record<string, BaseSchema>;
  labels: Record<string, string>;
};