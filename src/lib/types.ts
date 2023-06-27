import type { ZodBoolean, ZodDate, ZodNumber, ZodString } from 'zod';
import type { Page } from '@sveltejs/kit';

export type FormInputType = 'string' | 'number' | 'boolean' | 'date' | 'id';
export type TournamentType = 'Teams' | 'Solo';
export type Sort = 'asc' | 'desc';
export type FileType = 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif' | 'osr' | 'osz';

export type NullPartial<
  T extends Record<string | number | symbol, unknown>,
  IgnoreBooleans extends boolean = false,
  Except extends string = ''
> = {
  [K in keyof T]: K extends Except
    ? T[K]
    : IgnoreBooleans extends true
    ? T[K] extends boolean | (boolean | undefined)
      ? T[K]
      : T[K] | null
    : T[K] | null;
};

export type AssignFieldType<
  T extends Record<string, unknown>,
  K extends keyof T,
  Str,
  Num,
  Bool,
  DateTime,
  Default
> = T[K] extends string
  ? Str
  : T[K] extends string | undefined
  ? Str
  : T[K] extends string[]
  ? Str
  : T[K] extends number
  ? Num
  : T[K] extends number | undefined
  ? Num
  : T[K] extends number[]
  ? Num
  : T[K] extends boolean
  ? Bool
  : T[K] extends boolean | undefined
  ? Bool
  : T[K] extends Date | object
  ? DateTime
  : Default;

export type PageStore = Page<Record<string, string>, string | null>;
export type ParseInt<T> = T extends `${infer N extends number}` ? N : never;

export interface SessionUser {
  id: number;
  osuUserId: number;
  username: string;
  discordTag: string;
  isAdmin: boolean;
  updatedAt: Date;
}

export interface Field {
  label: string;
  mapToKey: string;
  type: FormInputType;
  optional?: boolean;
  validation?: ZodString | ZodNumber | ZodBoolean | ZodDate;
  disableIf?: (currentValue: Record<string, unknown>) => boolean;
  multipleValues?: boolean;
  values: {
    value: string | number;
    label: string;
  }[];
  selectMultiple?: boolean | {
    atLeast: number;
  };
  onSearch?: () => Promise<Record<string, unknown>>;
  mapResult?: MapResult;
  errorCount: number;
  list?: boolean; 
}

export interface MapResult {
  label: (result: Record<string, unknown>) => string;
  imgRef?: (result: Record<string, unknown>) => string;
}

export interface InputEvent extends Event {
  currentTarget: EventTarget & HTMLInputElement;
}

export type TournamentFormData = {
  name: string;
  acronym: string;
  isOpenRank: boolean;
  lowerRankRange?: number;
  upperRankRange?: number;
  useBWS: boolean;
  type: TournamentType;
  teamSize?: number;
  teamPlaySize?: number;
};

export interface PayPalOrder {
  id: string;
  purchase_units: {
    amount: {
      value: string;
    };
  }[];
}

export interface Post {
  id: number;
  title: string;
  published_at: string;
  cover_image: string;
  description: string;
}

export interface ExtendedPost extends Post {
  body_html: string;
}
