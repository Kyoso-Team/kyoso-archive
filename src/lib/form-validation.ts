import * as v from 'valibot';

const required = 'This field is required';

export const boolean = v.boolean;
export const literal = v.literal;
export const optional = v.optional;

export function string(pipe: Parameters<typeof v.string>[1]) {
  return v.string(required, pipe);
}

export function maxStrLength<T extends string, R extends number>(requirement: R) {
  return v.maxLength<T, R>(requirement, `Input must have ${requirement.toString()} characters or less`);
}

export function slug() {
  return v.custom(
    (input: string) => /[abcdefghijkmnlopqrstuvwxyz0123456789_]+$/.test(input),
    'Input can only contain the following characters: "abcdefghijkmnlopqrstuvwxyz0123456789_"'
  );
}

export function number(pipe: Parameters<typeof v.number>[1]) {
  return v.number(required, pipe);
}

export function integer() {
  return v.integer('Input must be an integer');
}

export function minValue<T extends number | bigint, R extends T>(requirement: R) {
  return v.minValue<T, R>(requirement, `Input must be greater than or equal to ${requirement.toString()}`);
}

export function maxValue<T extends number | bigint, R extends T>(requirement: R) {
  return v.maxValue<T, R>(requirement, `Input must be less than or equal to ${requirement.toString()}`);
}

export function union<T extends readonly string[]>(options: T) {
  return v.union<{ [K in keyof T]: v.LiteralSchema<T[K]> }>(
    options.map((type) => v.literal(type)) as any,
    required
  );
}