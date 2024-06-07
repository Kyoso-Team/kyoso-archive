import * as v from 'valibot';
import { formatDate, formatTime } from './utils';

const required = 'This field is required';

export const boolean = v.boolean;
export const literal = v.literal;
export const optional = v.nullable;

export function string(pipe: Parameters<typeof v.string>[1]) {
  return v.string(required, pipe);
}

export function minStrLength<T extends string, R extends number>(requirement: R) {
  return v.minLength<T, R>(
    requirement,
    `Input must have ${requirement.toString()} character(s) or more`
  );
}

export function maxStrLength<T extends string, R extends number>(requirement: R) {
  return v.maxLength<T, R>(
    requirement,
    `Input must have ${requirement.toString()} character(s) or less`
  );
}

export function url() {
  return v.url('Input must be a URL');
}

export function slug() {
  return v.custom(
    (input: string) => /^[a-z0-9_]+$/g.test(input),
    'Input can only contain the following characters: "abcdefghijkmnlopqrstuvwxyz0123456789_"'
  );
}

export function number(pipe: Parameters<typeof v.number>[1]) {
  return v.number(required, pipe);
}

export function notValue<T extends string | number | bigint | boolean | Date, R extends T>(requirement: R) {
  return v.notValue<T, R>(requirement, `Input must not be equal to ${requirement.toString()}`);
}

export function integer() {
  return v.integer('Input must be an integer');
}

export function minValue<T extends number | bigint, R extends T>(requirement: R) {
  return v.minValue<T, R>(
    requirement,
    `Input must be greater than or equal to ${requirement.toString()}`
  );
}

export function maxValue<T extends number | bigint, R extends T>(requirement: R) {
  return v.maxValue<T, R>(
    requirement,
    `Input must be less than or equal to ${requirement.toString()}`
  );
}

export function maxIntLimit() {
  const value = 2147483647;
  return v.maxValue<number, number>(
    value,
    `Input must be less than or equal to ${value.toString()}`
  );
}

export function minIntLimit() {
  const value = -2147483648;
  return v.maxValue<number, number>(
    value,
    `Input must be less than or equal to ${value.toString()}`
  );
}

export function union<T extends readonly string[]>(options: T) {
  return v.union<{ [K in keyof T]: v.LiteralSchema<T[K]> }>(
    options.map((type) => v.literal(type)) as any,
    required
  );
}

export function date(pipe?: Parameters<typeof v.date>[1]) {
  return v.date(required, pipe);
}

export function minDate(date: Date) {
  return v.minValue<Date, Date>(date, `Inputted date must be after ${formatDate(date)} - ${formatTime(date)}`);
}

export function maxDate(date: Date) {
  return v.maxValue<Date, Date>(date, `Inputtted date must be before ${formatDate(date)} - ${formatTime(date)}`);
}