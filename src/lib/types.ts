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
  tournamentOtherDatesSchema,
  tournamentLinkSchema,
  modMultiplierSchema
} from './schemas';
import type { Tournament, TournamentDates } from '$db';

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
export type TournamentOtherDates = Output<typeof tournamentOtherDatesSchema>;
export type RankRange = Output<typeof rankRangeSchema>;
export type ModMultiplier = Output<typeof modMultiplierSchema>;

export type RoundConfig = StandardRoundConfig | QualifierRoundConfig | BattleRoyaleRoundConfig;

export type FullTournament = typeof Tournament.$inferSelect &
  Omit<typeof TournamentDates.$inferSelect, 'tournamentId'>;

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

export interface BaseUserFormField {
  /** Nanoid of 8 characters (must be unique within the form itself, not across the entire database) */
  id: string;
  /** Limit of 200 characters */
  title: string;
  /** Limit of 300 characters. Written as markdown */
  description: string;
  required: boolean;
  type: 'shortText' | 'longText' | 'number' | 'select' | 'checkbox' | 'scale';
}

export interface UserFormShortTextField extends BaseUserFormField {
  type: 'shortText';
  config: {
    validation?: 'email' | 'url' | 'regex';
    regex?: string;
    length?: number | number[];
  };
}

export interface UserFormLongTextField extends BaseUserFormField {
  type: 'longText';
  config: {
    validation?: 'regex';
    regex?: string;
    length?: number | number[];
  };
}

export interface UserFormNumberField extends BaseUserFormField {
  type: 'number';
  config: {
    integer: boolean;
    not: boolean;
    validation?: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';
    length?: number | number[];
  };
}

export interface UserFormSelectField extends BaseUserFormField {
  type: 'select';
  config: {
    dropdown: boolean;
    /** Limit of 100 options */
    options: string[];
  };
}

export interface UserFormCheckboxField extends BaseUserFormField {
  type: 'checkbox';
  config: {
    /** Limit of 100 options */
    options: string[];
    validation?: 'gt' | 'lt' | 'eq' | 'between';
    length?: number | number[];
  };
}

export interface UserFormScaleField extends BaseUserFormField {
  type: 'scale';
  config: {
    from: {
      value: number;
      label?: string;
    };
    to: {
      value: number;
      label?: string;
    };
  };
}

export type UserFormField =
  | UserFormShortTextField
  | UserFormLongTextField
  | UserFormNumberField
  | UserFormSelectField
  | UserFormCheckboxField
  | UserFormScaleField;

export interface UserFormFieldResponse {
  /** ID of the field within the form */
  id: string;
  response: string;
}

export type InferEnum<
  T extends {
    enumValues: string[];
  }
> = T['enumValues'][number];

export type FileType = 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif' | 'osr' | 'osz';

export type TRPCRouter<Input extends boolean = false> = {
  [K1 in Exclude<keyof Router, '_def' | 'createCaller' | 'getErrorShape'>]: {
    [K2 in Exclude<
      keyof Router[K1],
      '_def' | 'createCaller' | 'getErrorShape'
    >]: Router[K1][K2] extends { _def: { _output_out: any; _input_in: any } }
      ? Input extends true
        ? Router[K1][K2]['_def']['_input_in']
        : Router[K1][K2]['_def']['_output_out']
      : never;
  };
};

export type PageStore = Page<Record<string, string>, string | null>;

export type FormStore = Writable<{
  value: Record<string, any>;
  defaults: Record<string, any>;
  overwritten: Record<string, any>;
  errors: Record<string, string | undefined>;
  canSubmit: boolean;
}> & {
  schemas: Record<string, BaseSchema>;
  labels: Record<string, string>;
  setGlobalError: (err: string) => void;
  setValue: (key: string, input: any) => void;
  setOverwrittenState: (key: string, state: boolean) => void;
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

export interface Asset<Put extends Record<string, any>, Delete extends Record<string, any>> {
  put: Put;
  delete: Delete;
}

export interface Assets {
  tournamentBanner: Asset<
    {
      file: File;
      tournamentId: number;
    },
    {
      tournamentId: number;
    }
  >;
  tournamentLogo: Asset<
    {
      file: File;
      tournamentId: number;
    },
    {
      tournamentId: number;
    }
  >;
}
