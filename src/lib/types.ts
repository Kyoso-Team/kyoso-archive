import type { MaybePromise, Page } from '@sveltejs/kit';
import type { Router } from '$trpc/router';
import type { Writable } from 'svelte/store';
import type { BaseSchema, Output } from 'valibot';
import type {
  bwsValuesSchema,
  draftTypeSchema,
  rankRangeSchema,
  refereeSettingsSchema,
  teamSettingsSchema,
  tournamentDatesSchema,
  tournamentLinkSchema
} from './schemas';

export type AnyComponent = any;

export type Simplify<T extends Record<string, any>> = {
  [K in keyof T]: T[K];
} & NonNullable<unknown>;

export interface OAuthToken {
  /** Encrypted using JWT */
  accesstoken: string;
  /** Encrypted using JWT */
  refreshToken: string;
  /** Timestamp in milliseconds */
  tokenIssuedAt: number;
}

/** Linear: ABAB. Snake: ABBA */
export type DraftType = Output<typeof draftTypeSchema>;
export type RefereeSettings = Output<typeof refereeSettingsSchema>;
export type TournamentLink = Output<typeof tournamentLinkSchema>;
export type BWSValues = Output<typeof bwsValuesSchema>;
export type TeamSettings = Output<typeof teamSettingsSchema>;
export type TournamentDates = Output<typeof tournamentDatesSchema>;
export type RankRange = Output<typeof rankRangeSchema>;

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
    [K2 in Exclude<
      keyof Router[K1],
      '_def' | 'createCaller' | 'getErrorShape'
    >]: Router[K1][K2] extends { _def: { _output_out: any } }
      ? Router[K1][K2]['_def']['_output_out']
      : never;
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

export type OnServerError = (err: unknown) => MaybePromise<void>;

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
  };
  discord: {
    id: string;
    username: string;
  };
  /** This property is used when a dev impersonates a user. This should only ever be used in development environments */
  realUser?: {
    id: number;
    osuUserId: number;
    discordUserId: string;
  };
}
