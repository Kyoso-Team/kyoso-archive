import * as v from 'valibot';
import { formatDate, formatTime } from '$lib/format';

const required = 'This field is required';

export const boolean = v.boolean;
export const literal = v.literal;
export const optional = v.nullable;
export const pipe = v.pipe;

export function array<TItem extends v.GenericSchema>(item: TItem) {
  return v.array(item, required);
}

export function minArrayLength<T extends any[], R extends number>(requirement: R) {
  return v.minLength<T, R, string>(requirement, `Select ${requirement.toString()} or more options`);
}

export function maxArrayLength<T extends any[], R extends number>(requirement: R) {
  return v.maxLength<T, R, string>(requirement, `Select ${requirement.toString()} or less options`);
}

export function string() {
  return v.string(required);
}

export function minStrLength<T extends string, R extends number>(requirement: R) {
  return v.minLength<T, R, string>(
    requirement,
    `Input must have ${requirement.toString()} character(s) or more`
  );
}

export function maxStrLength<T extends string, R extends number>(requirement: R) {
  return v.maxLength<T, R, string>(
    requirement,
    `Input must have ${requirement.toString()} character(s) or less`
  );
}

export function url() {
  return v.url('Input must be a URL');
}

export function slug() {
  return v.check(
    (input: string) => /^[a-z0-9-]+$/g.test(input),
    'Input can only contain the following characters: "abcdefghijkmnlopqrstuvwxyz0123456789-"'
  );
}

export function number() {
  return v.number(required);
}

export function notValue<T extends string | number | bigint | boolean | Date, R extends T>(
  requirement: R
) {
  return v.notValue<T, R, string>(
    requirement,
    `Input must not be equal to ${requirement.toString()}`
  );
}

export function integer() {
  return v.integer('Input must be an integer');
}

export function minValue<T extends number | bigint, R extends T>(requirement: R) {
  return v.minValue<T, R, string>(
    requirement,
    `Input must be greater than or equal to ${requirement.toString()}`
  );
}

export function maxValue<T extends number | bigint, R extends T>(requirement: R) {
  return v.maxValue<T, R, string>(
    requirement,
    `Input must be less than or equal to ${requirement.toString()}`
  );
}

export function maxIntLimit() {
  const value = 2147483647;
  return v.maxValue<number, number, string>(
    value,
    `Input must be less than or equal to ${value.toString()}`
  );
}

export function minIntLimit() {
  const value = -2147483648;
  return v.maxValue<number, number, string>(
    value,
    `Input must be less than or equal to ${value.toString()}`
  );
}

export function union<T extends readonly string[]>(options: T) {
  return v.union<{ [K in keyof T]: v.LiteralSchema<T[K], string> }, string>(
    options.map((type) => v.literal(type)) as any,
    required
  );
}

export function date() {
  return v.date(required);
}

export function minDate(date: Date) {
  return v.minValue<Date, Date, string>(
    date,
    `Inputted date must be after ${formatDate(date)}, ${formatTime(date)}`
  );
}

export function maxDate(date: Date) {
  return v.maxValue<Date, Date, string>(
    date,
    `Inputtted date must be before ${formatDate(date)}, ${formatTime(date)}`
  );
}
