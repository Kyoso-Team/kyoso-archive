export type Simplify<T extends Record<string, any>> = {
  [K in keyof T]: T[K];
} & NonNullable<unknown>;

export type InferEnum<
  T extends {
    enumValues: string[];
  }
> = T['enumValues'][number];

export type ParseInt<T> = T extends `${infer N extends number}` ? N : never;

export type MaybePromise<T> = T | Promise<T>;
