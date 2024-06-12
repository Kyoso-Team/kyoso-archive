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
  modMultiplierSchema,
  userFormFieldSchema
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
export type UserFormField = Output<typeof userFormFieldSchema>;

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

export type AnyForm = {
  value: Record<string, any>;
  errors: Partial<Record<string, string>>;
  updated: Partial<Record<string, true>>;
  overwritten: Partial<Record<string, true>>;
  defaults: Record<string, any>;
  canSubmit: boolean;
  hasUpdated: boolean;
};

export type FormStore = Writable<AnyForm> & {
  reset: () => void;
  setValue: (key: string, input: any) => void;
  getFinalValue: <UpdatedOnly extends boolean = false>(
    form: Pick<Record<string, any>, 'value' | 'updated' | 'errors'>,
    options?:
      | {
          updatedFieldsOnly?: UpdatedOnly | undefined;
        }
      | undefined
  ) => UpdatedOnly extends true ? Partial<Record<string, any>> : Record<string, any>;
  overrideInitialValues: (newDefaults: Record<string, any>) => void;
  setOverwrittenState: (key: string, state: boolean) => void;
  schemas: Record<string, BaseSchema>;
  labels: Record<string, string>;
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

// Source: https://github.com/skeletonlabs/skeleton/blob/master/packages/skeleton/src/lib/utilities/Popup/types.ts
type Direction = 'top' | 'bottom' | 'left' | 'right';
type Placement = Direction | `${Direction}-start` | `${Direction}-end`;

export interface Middleware {
  // Required ---
  /** Offset middleware settings: https://floating-ui.com/docs/offset */
  offset?: number | Record<string, any>;
  /** Shift middleware settings: https://floating-ui.com/docs/shift */
  shift?: Record<string, any>;
  /** Flip middleware settings: https://floating-ui.com/docs/flip */
  flip?: Record<string, any>;
  /** Arrow middleware settings: https://floating-ui.com/docs/arrow */
  arrow?: { element: string } & Record<string, any>;
  // Optional ---
  /** Size middleware settings: https://floating-ui.com/docs/size */
  size?: Record<string, any>;
  /** Auto Placement middleware settings: https://floating-ui.com/docs/autoPlacement */
  autoPlacement?: Record<string, any>;
  /** Hide middleware settings: https://floating-ui.com/docs/hide */
  hide?: Record<string, any>;
  /** Inline middleware settings: https://floating-ui.com/docs/inline */
  inline?: Record<string, any>;
}

export interface PopupSettings {
  /** Provide the event type. */
  event: 'click' | 'hover' | 'focus-blur' | 'focus-click' | 'focus-hover';
  /** Match the popup data value `data-popup="targetNameHere"` */
  target: string;
  /** Set the placement position. Defaults 'bottom'. */
  placement?: Placement;
  /** Query elements that close the popup when clicked. Defaults `'a[href], button'`. */
  closeQuery?: string;
  /** Optional callback function that reports state change. */
  state?: (event: { state: boolean }) => void;
  /** Provide Floating UI middleware settings. */
  middleware?: Middleware;
}
