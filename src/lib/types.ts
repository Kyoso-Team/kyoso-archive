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
import type { Writable } from 'svelte/store';
import type { BaseSchema } from 'valibot';
// import type { InferSelectModel } from 'drizzle-orm';

export type Simplify<T extends Record<string, any>> = { [K in keyof T]: T[K] } & NonNullable<unknown>;

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
  minTeamSize: number;
  maxTeamSize: number;
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

export type InferEnum<
  T extends {
    enumValues: string[];
  }
> = T['enumValues'][number];

export type FileType = 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif' | 'osr' | 'osz';

export type TRPCRouter = {
  [K1 in Exclude<keyof Router, '_def' | 'createCaller' | 'getErrorShape'>]: {
    [K2 in Exclude<keyof Router[K1], '_def' | 'createCaller' | 'getErrorShape'>]
      : Router[K1][K2] extends { _def: { _output_out: any; }; } ? Router[K1][K2]['_def']['_output_out'] : never
  };
};

export type PageStore = Page<Record<string, string>, string | null>;
export type FormStore = Writable<{
  value: Record<string, any>;
  errors: Record<string, string | undefined>;
  canSubmit: boolean;
}> & {
  schemas: Record<string, BaseSchema>;
  labels: Record<string, string>;
  setGlobalError: (err: string) => void;
  setValue: (key: string, input: any) => void;
  getFinalValue: (form: any) => Record<string, any>;
};
export type ParseInt<T> = T extends `${infer N extends number}` ? N : never;

export interface AuthSession {
  sessionId: number;
  userId: number;
  admin: boolean;
  approvedHost: boolean;
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
