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
import type { Router } from '$trpc/router';
// import type { InferSelectModel } from 'drizzle-orm';

export interface OAuthToken {
  /** Encrypted using JWT */
  accesstoken: string;
  /** Encrypted using JWT */
  refreshToken: string;
  /** Timestamp in milliseconds */
  tokenIssuedAt: number;
}

/** Linear: ABAB. Snake: ABBA */
export type DraftType = 'linear' | 'snake';
export interface RefereeSettings {
  timerLength: {
    pick: number;
    ban: number;
    protect: number;
    ready: number;
    start: number;
  };
  allow: {
    doublePick: boolean;
    doubleBan: boolean;
    doubleProtect: boolean;
  };
  order: {
    ban: DraftType;
    pick: DraftType;
    protect: DraftType;
  }
  alwaysForceNoFail: boolean;
  banAndProtectCancelOut: boolean;
  winCondition: 'score' | 'accuracy' | 'combo';
}

export interface TournamentLink {
  label: string;
  url: string;
  icon: 'osu' | 'discord' | 'google_sheets' | 'google_forms' | 'twitch' | 'youtube' | 'x' | 'challonge' | 'donate' | 'website';
}

export interface BWSValues {
  x: number;
  y: number;
  z: number;
}

export interface TeamSettings {
  teamSize: number;
  playersPerMap: number;
  useTeamBanners: boolean;
}

export interface TournamentDates {
  publish?: number;
  concludes?: number;
  playerRegs?: {
    open: number;
    close: number;
  };
  staffRegs?: {
    open: number;
    close: number;
  };
  other: {
    label: string;
    date: number;
  }[];
}

export interface RankRange {
  lower: number;
  upper?: number;
}

export type RoundConfig = StandardRoundConfig | QualifierRoundConfig | BattleRoyaleRoundConfig;

/** Applies to: Groups, swiss, single and double elim. */
export interface StandardRoundConfig {
  bestOf: number;
  banCount: number;
  protectCount: number;
}

export interface QualifierRoundConfig {
  publishMpLinks: boolean;
  runCount: number;
  /**
   * Only matters if there are multiple runs.
   * `average`: Calculate the average score for each map in all runs.
   * `sum`: Calculate the sum of scores for each map in all runs.
   * `best`: Get the best score for each map
   */
  summarizeRunsAs: 'average' | 'sum' | 'best';
}

export interface BattleRoyaleRoundConfig {
  playersEliminatedPerMap: number;
}

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

export type TRPCRouter = {
  [K1 in Exclude<keyof Router, '_def' | 'createCaller' | 'getErrorShape'>]: {
    [K2 in Exclude<keyof Router[K1], '_def' | 'createCaller' | 'getErrorShape'>]
      : Router[K1][K2] extends { _def: { _output_out: any; }; } ? Router[K1][K2]['_def']['_output_out'] : never
  };
};

export type PageStore = Page<Record<string, string>, string | null>;
export type ParseInt<T> = T extends `${infer N extends number}` ? N : never;

export interface AuthSession {
  sessionId: number;
  userId: number;
  admin: boolean;
  /** Timestamp in miliseconds */
  updatedApiDataAt: number;
  osu: {
    id: number;
    username: string;
    restricted: boolean;
    globalStdRank: number | null;
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
