import * as v from 'valibot';
import {
  lower32BitIntLimit,
  maxPossibleDate,
  oldestDatePossible,
  upper32BitIntLimit
} from '$lib/constants';
import {
  draftTypeSchema,
  hexColorSchema,
  nonEmptyStringSchema,
  tournamentLinkIconSchema,
  winConditionSchema
} from './basic';

export const clientEnvSchema = v.object({
  PUBLIC_OSU_CLIENT_ID: v.pipe(v.number('be a number'), v.integer('be an integer')),
  PUBLIC_OSU_REDIRECT_URI: nonEmptyStringSchema,
  PUBLIC_DISCORD_CLIENT_ID: nonEmptyStringSchema,
  PUBLIC_DISCORD_MAIN_REDIRECT_URI: nonEmptyStringSchema,
  PUBLIC_DISCORD_CHANGE_ACCOUNT_REDIRECT_URI: nonEmptyStringSchema,
  PUBLIC_CONTACT_EMAIL: v.pipe(v.string('be a string'), v.email('be an email'))
});

export const serverEnvSchema = v.object({
  ...clientEnvSchema.entries,
  NODE_ENV: v.union(
    [v.literal('production'), v.literal('development')],
    'be equal to "production" or "development"'
  ),
  TEST_ENV: v.union(
    [v.literal('automatic'), v.literal('manual'), v.undefined_()],
    'be equal to "automatic", "manual" or undefined'
  ),
  JWT_SECRET: nonEmptyStringSchema,
  CRON_SECRET: nonEmptyStringSchema,
  OSU_CLIENT_SECRET: nonEmptyStringSchema,
  DISCORD_CLIENT_SECRET: nonEmptyStringSchema,
  DISCORD_BOT_TOKEN: nonEmptyStringSchema,
  IPINFO_ACCESS_TOKEN: nonEmptyStringSchema,
  DATABASE_URL: nonEmptyStringSchema,
  TEST_DATABASE_URL: nonEmptyStringSchema,
  OWNER: v.pipe(v.number('be a number'), v.integer('be an integer')),
  TESTERS: v.array(v.pipe(v.number('be a number'), v.integer('be an integer')), 'be an array'),
  UPSTASH_REDIS_REST_URL: nonEmptyStringSchema,
  UPSTASH_REDIS_REST_TOKEN: nonEmptyStringSchema,
  S3_FORCE_PATH_STYLE: v.boolean('be a boolean'),
  S3_ENDPOINT: nonEmptyStringSchema,
  S3_REGION: nonEmptyStringSchema,
  S3_ACCESS_KEY_ID: nonEmptyStringSchema,
  S3_SECRET_ACCESS_KEY: nonEmptyStringSchema
});

export const refereeSettingsSchema = v.object({
  timerLength: v.object({
    pick: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(600)),
    ban: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(600)),
    protect: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(600)),
    ready: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(600)),
    start: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(600))
  }),
  allow: v.object({
    doublePick: v.boolean(),
    doubleBan: v.boolean(),
    doubleProtect: v.boolean()
  }),
  order: v.object({
    ban: draftTypeSchema,
    pick: draftTypeSchema,
    protect: draftTypeSchema
  }),
  alwaysForceNoFail: v.boolean(),
  banAndProtectCancelOut: v.boolean(),
  winCondition: winConditionSchema
});

export const tournamentLinkSchema = v.object({
  label: v.pipe(v.string(), v.minLength(2), v.maxLength(30)),
  url: v.pipe(v.string(), v.url()),
  icon: tournamentLinkIconSchema
});

export const bwsValuesSchema = v.object({
  x: v.pipe(v.number(), v.notValue(0), v.minValue(-10), v.maxValue(10)),
  y: v.pipe(v.number(), v.notValue(0), v.minValue(-10), v.maxValue(10)),
  z: v.pipe(v.number(), v.notValue(0), v.minValue(-10), v.maxValue(10))
});

export const teamSettingsSchema = v.object({
  minTeamSize: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(16)),
  maxTeamSize: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(16)),
  useTeamBanners: v.boolean()
});

export const tournamentOtherDatesSchema = v.object({
  label: v.pipe(v.string(), v.minLength(2), v.maxLength(35)),
  onlyDate: v.boolean(),
  fromDate: v.pipe(
    v.number(),
    v.minValue(oldestDatePossible.getTime()),
    v.maxValue(maxPossibleDate.getTime())
  ),
  toDate: v.nullable(
    v.pipe(
      v.number(),
      v.minValue(oldestDatePossible.getTime()),
      v.maxValue(maxPossibleDate.getTime())
    )
  )
});

export const rankRangeSchema = v.object({
  lower: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER)),
  upper: v.nullable(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER))
  )
});

export const modMultiplierSchema = v.union([
  v.object({
    /** Easy, Hidden, Hard Rock, Flashlight, Blinds */
    mods: v.pipe(
      v.array(
        v.union([
          v.literal('ez'),
          v.literal('hd'),
          v.literal('hr'),
          v.literal('fl'),
          v.literal('bl')
        ])
      ),
      v.minLength(1),
      v.maxLength(5)
    ),
    multiplier: v.pipe(v.number(), v.minValue(-5), v.maxValue(5))
  }),
  v.object({
    /** Sudden Death, Perfect */
    mods: v.pipe(
      v.array(
        v.union([
          // Same as above
          v.literal('ez'),
          v.literal('hd'),
          v.literal('hr'),
          v.literal('fl'),
          v.literal('bl'),
          // -------------
          v.literal('sd'),
          v.literal('pf')
        ])
      ),
      v.minLength(1),
      v.maxLength(5)
    ),
    multiplier: v.object({
      ifSuccessful: v.pipe(v.number(), v.minValue(-5), v.maxValue(5)),
      ifFailed: v.pipe(v.number(), v.minValue(-5), v.maxValue(5))
    })
  })
]);

const baseUserFormFieldSchemas = {
  /** Nanoid (must be unique within the form itself, not across the entire database) */
  id: v.pipe(v.string(), v.length(8)),
  title: v.pipe(v.string(), v.minLength(2), v.maxLength(200)),
  /** Written as markdown */
  description: v.nullable(v.pipe(v.string(), v.maxLength(300))),
  optional: v.boolean(),
  deleted: v.boolean()
};

const baseUserFormShortTextFieldSchemas = {
  ...baseUserFormFieldSchemas,
  type: v.literal('short-text'),
  validation: v.null_(),
  min: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0))),
  max: v.nullable(v.pipe(v.number(), v.integer(), v.maxValue(100)))
};

const userFormShortTextField = v.union([
  v.object(baseUserFormShortTextFieldSchemas),
  v.object({
    ...baseUserFormShortTextFieldSchemas,
    validation: v.union([v.literal('email'), v.literal('url')])
  }),
  v.object({
    ...baseUserFormShortTextFieldSchemas,
    validation: v.union([v.literal('regex'), v.literal('contains'), v.literal('not-contains')]),
    value: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
  })
]);

const baseUserFormLongTextFieldSchemas = {
  ...baseUserFormFieldSchemas,
  type: v.literal('long-text'),
  validation: v.null_(),
  min: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0))),
  max: v.nullable(v.pipe(v.number(), v.integer(), v.maxValue(10000)))
};

const userFormLongTextFieldSchema = v.union([
  v.object(baseUserFormLongTextFieldSchemas),
  v.object({
    ...baseUserFormLongTextFieldSchemas,
    validation: v.literal('regex'),
    value: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
  })
]);

const baseUserFormNumberFieldSchema = {
  ...baseUserFormFieldSchemas,
  type: v.literal('number'),
  validation: v.null_(),
  integer: v.boolean()
};

const userFormNumberFieldSchema = v.union([
  v.object(baseUserFormNumberFieldSchema),
  v.object({
    ...baseUserFormNumberFieldSchema,
    validation: v.union([
      v.literal('gt'),
      v.literal('gte'),
      v.literal('lt'),
      v.literal('lte'),
      v.literal('not-eq')
    ]),
    value: v.pipe(v.number(), v.minValue(lower32BitIntLimit), v.maxValue(upper32BitIntLimit))
  }),
  v.object({
    ...baseUserFormNumberFieldSchema,
    validation: v.union([v.literal('between'), v.literal('not-between')]),
    min: v.nullable(
      v.pipe(v.number(), v.minValue(lower32BitIntLimit), v.maxValue(upper32BitIntLimit))
    ),
    max: v.nullable(
      v.pipe(v.number(), v.minValue(lower32BitIntLimit), v.maxValue(upper32BitIntLimit))
    )
  })
]);

const userFormSelectFieldSchema = v.object({
  ...baseUserFormFieldSchemas,
  type: v.literal('select'),
  options: v.pipe(
    v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
    v.minLength(2),
    v.maxLength(100)
  )
});

const userFormCheckboxFieldSchema = v.object({
  ...baseUserFormFieldSchemas,
  type: v.literal('checkbox'),
  check: v.boolean()
});

const baseUserFormSelectMultipleFieldSchema = {
  ...baseUserFormFieldSchemas,
  type: v.literal('select-multiple'),
  validation: v.null_(),
  options: v.pipe(
    v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
    v.minLength(2),
    v.maxLength(100)
  )
};

const userFormSelectMultipleFieldSchema = v.union([
  v.object(baseUserFormSelectMultipleFieldSchema),
  v.object({
    ...baseUserFormSelectMultipleFieldSchema,
    validation: v.union([
      v.literal('gt'),
      v.literal('gte'),
      v.literal('lt'),
      v.literal('lte'),
      v.literal('eq'),
      v.literal('not-eq')
    ]),
    value: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100))
  }),
  v.object({
    ...baseUserFormSelectMultipleFieldSchema,
    validation: v.union([v.literal('between'), v.literal('not-between')]),
    min: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100))),
    max: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100)))
  })
]);

const userFormScaleFieldSchema = v.object({
  ...baseUserFormFieldSchemas,
  type: v.literal('scale'),
  from: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(1)),
  fromLabel: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  to: v.pipe(v.number(), v.integer(), v.minValue(2), v.maxValue(10)),
  toLabel: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
});

const baseUserFormDateTimeFieldSchemas = {
  ...baseUserFormFieldSchemas,
  type: v.literal('datetime'),
  onlyDate: v.boolean(),
  validation: v.null_()
};

const userFormDateTimeFieldSchema = v.union([
  v.object(baseUserFormDateTimeFieldSchemas),
  v.object({
    ...baseUserFormDateTimeFieldSchemas,
    validation: v.union([
      v.literal('gt'),
      v.literal('gte'),
      v.literal('lt'),
      v.literal('lte'),
      v.literal('not-eq')
    ]),
    value: v.pipe(
      v.number(),
      v.minValue(oldestDatePossible.getTime()),
      v.maxValue(maxPossibleDate.getTime())
    )
  }),
  v.object({
    ...baseUserFormDateTimeFieldSchemas,
    validation: v.union([v.literal('between'), v.literal('not-between')]),
    min: v.nullable(
      v.pipe(
        v.number(),
        v.minValue(oldestDatePossible.getTime()),
        v.maxValue(maxPossibleDate.getTime())
      )
    ),
    max: v.nullable(
      v.pipe(
        v.number(),
        v.minValue(oldestDatePossible.getTime()),
        v.maxValue(maxPossibleDate.getTime())
      )
    )
  })
]);

export const userFormFieldSchema = v.union([
  userFormShortTextField,
  userFormLongTextFieldSchema,
  userFormNumberFieldSchema,
  userFormSelectFieldSchema,
  userFormCheckboxFieldSchema,
  userFormSelectMultipleFieldSchema,
  userFormScaleFieldSchema,
  userFormDateTimeFieldSchema
]);

export const userFormFieldResponseSchema = v.record(
  v.pipe(v.string(), v.length(8)),
  v.pipe(v.string(), v.minLength(0), v.maxLength(10000))
);

export const colorShadesSchema = v.union([
  v.literal('50'),
  v.literal('100'),
  v.literal('200'),
  v.literal('300'),
  v.literal('400'),
  v.literal('500'),
  v.literal('600'),
  v.literal('700'),
  v.literal('800'),
  v.literal('900')
]);

export const tournamentThemeSchema = v.object({
  use: v.boolean(),
  colors: v.object({
    surface: v.record(colorShadesSchema, v.pipe(v.string(), hexColorSchema)),
    primary: v.record(colorShadesSchema, v.pipe(v.string(), hexColorSchema))
  }),
  fontFamilies: v.object({
    base: v.string(),
    headings: v.string()
  }),
  fontColors: v.object({
    base: v.string(),
    headings: v.string()
  })
});

export const userSettingsSchema = v.object({
  /** Whether or not to make their Discord username public on their profile page */
  publicDiscord: v.boolean(),
  /** Whether or not to display their tournament staff history on their profile page */
  publicStaffHistory: v.boolean(),
  /** Whether or not to display their tournament player history on their profile page */
  publicPlayerHistory: v.boolean()
});
