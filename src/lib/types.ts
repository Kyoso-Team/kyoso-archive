// import type {
//   dbMappoolState,
//   dbTournamentService,
//   dbMod,
//   dbStaffPermission,
//   dbStaffColor,
//   dbModMultiplier,
//   dbStaffRole,
//   dbBanOrder,
//   dbTournamentType,
//   dbWinCondition,
//   dbPrizeType,
//   dbCashMetric,
//   dbQualifierRunsSummary,
//   dbStageFormat
// } from '$db/schema';
// import type { ZodBoolean, ZodDate, ZodNumber, ZodString } from 'zod';
import type { Page } from '@sveltejs/kit';
// import type { InferSelectModel } from 'drizzle-orm';

// Alias for any which refers to specifically any Svelte component. I (Mario564) dont' know how to use Svelte component classes as generics in function and variable type definitions
export type AnyComponent = any;

// export type InferEnum<
//   T extends {
//     enumValues: string[];
//   }
// > = T['enumValues'][number];
// export type MappoolState = InferEnum<typeof dbMappoolState>;
// export type TournamentService = InferEnum<typeof dbTournamentService>;
// export type Mod = InferEnum<typeof dbMod>;
// export type StaffPermission = InferEnum<typeof dbStaffPermission>;
// export type StaffColor = InferEnum<typeof dbStaffColor>;
// export type BanOrder = InferEnum<typeof dbBanOrder>;
// export type TournamentType = InferEnum<typeof dbTournamentType>;
// export type WinCondition = InferEnum<typeof dbWinCondition>;
// export type PrizeType = InferEnum<typeof dbPrizeType>;
// export type CashMetric = InferEnum<typeof dbCashMetric>;
// export type QualifierRunsSummary = InferEnum<typeof dbQualifierRunsSummary>;
// export type StageFormat = InferEnum<typeof dbStageFormat>;

// export type ModMultiplier = InferSelectModel<typeof dbModMultiplier>;
// export type StaffRole = InferSelectModel<typeof dbStaffRole>;

// export type FormInputType = 'string' | 'number' | 'boolean' | 'date' | 'id';
// export type Sort = 'asc' | 'desc';
// export type FileType = 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif' | 'osr' | 'osz';

// export type NullPartial<
//   T extends Record<string | number | symbol, unknown>,
//   IgnoreBooleans extends boolean = false,
//   Except extends string = ''
// > = {
//   [K in keyof T]: K extends Except
//     ? T[K]
//     : IgnoreBooleans extends true
//     ? T[K] extends boolean | (boolean | undefined)
//       ? T[K]
//       : T[K] | null
//     : T[K] | null;
// };

// export type AssignFieldType<
//   T extends Record<string, unknown>,
//   K extends keyof T,
//   Str,
//   Num,
//   Bool,
//   DateTime,
//   Default
// > = T[K] extends string
//   ? Str
//   : T[K] extends string | undefined
//   ? Str
//   : T[K] extends string | null
//   ? Str
//   : T[K] extends string | undefined | null
//   ? Str
//   : T[K] extends string[]
//   ? Str
//   : T[K] extends number
//   ? Num
//   : T[K] extends number | undefined
//   ? Num
//   : T[K] extends number | null
//   ? Num
//   : T[K] extends number | undefined | null
//   ? Num
//   : T[K] extends number[]
//   ? Num
//   : T[K] extends boolean
//   ? Bool
//   : T[K] extends boolean | undefined
//   ? Bool
//   : T[K] extends Date | object
//   ? DateTime
//   : Default;

export type PageStore = Page<Record<string, string>, string | null>;
// export type ParseInt<T> = T extends `${infer N extends number}` ? N : never;

export interface Session {
  userId: number;
  isAdmin: boolean;
  /** Timestamp in miliseconds */
  updatedAt: number;
  osu: {
    id: number;
    username: string;
  };
  discord: {
    id: string;
    username: string;
  };
}

// export interface SessionUser {
//   id: number;
//   osuUserId: number;
//   username: string;
//   discordTag: string;
//   isAdmin: boolean;
//   updatedAt: Date;
// }

// export interface Field {
//   label: string;
//   mapToKey: string;
//   type: FormInputType;
//   optional?: boolean;
//   validation?: ZodString | ZodNumber | ZodBoolean | ZodDate;
//   disableIf?: (currentValue: Record<string, unknown>) => boolean;
//   multipleValues?: boolean;
//   values: {
//     value: string | number;
//     label: string;
//   }[];
//   selectMultiple?:
//     | boolean
//     | {
//         atLeast: number;
//       };
//   onSearch?: () => Promise<Record<string, unknown>>;
//   mapResult?: MapResult;
//   errorCount: number;
//   list?: boolean;
// }

// export interface MapResult {
//   label: (result: Record<string, unknown>) => string;
//   imgRef?: (result: Record<string, unknown>) => string;
// }

// export interface InputEvent extends Event {
//   currentTarget: EventTarget & HTMLInputElement;
// }

// export type TournamentFormData = {
//   name: string;
//   acronym: string;
//   isOpenRank: boolean;
//   lowerRankRange?: number;
//   upperRankRange?: number;
//   useBWS: boolean;
//   type: TournamentType;
//   teamSize?: number;
//   teamPlaySize?: number;
// };

// export interface PayPalOrder {
//   id: string;
//   purchase_units: {
//     amount: {
//       value: string;
//     };
//   }[];
// }

// export interface Post {
//   id: number;
//   title: string;
//   published_at: string;
//   cover_image: string;
//   description: string;
// }

// export interface ExtendedPost extends Post {
//   body_html: string;
// }

// export interface LinkModalResponse {
//   displayText: string;
//   link: string;
// }
