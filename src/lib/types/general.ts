import type * as v from 'valibot';
import type { Tournament, TournamentDates } from '$db';
import type {
  bwsValuesSchema,
  draftTypeSchema,
  modMultiplierSchema,
  rankRangeSchema,
  refereeSettingsSchema,
  teamSettingsSchema,
  tournamentLinkSchema,
  tournamentOtherDatesSchema,
  tournamentThemeSchema,
  userFormFieldResponseSchema,
  userFormFieldSchema,
  userSettingsSchema
} from '$lib/validation';

export type ErrorInside = 'trpc' | 'hook' | 'api' | 'layout' | 'page';

export type FileType = 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif' | 'osr' | 'osz';

export type FullTournament = typeof Tournament.$inferSelect &
  Omit<typeof TournamentDates.$inferSelect, 'tournamentId'>;

export type RoundConfig = StandardRoundConfig | QualifierRoundConfig | BattleRoyaleRoundConfig;

export interface OAuthToken {
  /** Encrypted using JWT */
  accesstoken: string;
  /** Encrypted using JWT */
  refreshToken: string;
  /** Timestamp in milliseconds */
  tokenIssuedAt: number;
}

export interface PaginationSettings {
  offset: number;
  limit: number;
}

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

/** Linear: ABAB. Snake: ABBA */
export type DraftType = v.InferOutput<typeof draftTypeSchema>;
export type RefereeSettings = v.InferOutput<typeof refereeSettingsSchema>;
export type TournamentLink = v.InferOutput<typeof tournamentLinkSchema>;
export type BWSValues = v.InferOutput<typeof bwsValuesSchema>;
export type TeamSettings = v.InferOutput<typeof teamSettingsSchema>;
export type TournamentOtherDates = v.InferOutput<typeof tournamentOtherDatesSchema>;
export type RankRange = v.InferOutput<typeof rankRangeSchema>;
export type ModMultiplier = v.InferOutput<typeof modMultiplierSchema>;
export type UserFormField = v.InferOutput<typeof userFormFieldSchema>;
export type UserFormFieldResponse = v.InferOutput<typeof userFormFieldResponseSchema>;
export type TournamentTheme = v.InferOutput<typeof tournamentThemeSchema>;
export type UserSettings = v.InferOutput<typeof userSettingsSchema>;
