import * as v from 'valibot';
import {
  lower32BitIntLimit,
  maxPossibleDate,
  oldestDatePossible,
  upper32BitIntLimit
} from './constants';

// When writing the error messages for scehmas, keep in mind that the message will be formated like:
// "Invalid input: {object_name}.{property} should {message}"
// Example: "Invalid input: body.tournamentId should be a number"
// (The messages will not appear in tRPC procedures)

export const positiveIntSchema = v.number('be a number', [
  v.integer('be an integer'),
  v.minValue(1, 'be greater or equal to 1')
]);

export const fileIdSchema = v.string('be a string', [v.length(8, 'have 8 characters')]);

export const fileSchema = v.instance(File, 'be a file');

export const boolStringSchema = v.transform(
  v.union([v.literal('true'), v.literal('false')], 'be a boolean'),
  (input) => input === 'true'
);

export const urlSlugSchema = v.custom(
  (input: string) => /^[a-z0-9_]+$/g.test(input),
  'only contain the following characters: "abcdefghijkmnlopqrstuvwxyz0123456789_"'
);

export const hexColorSchema = v.custom(
  (input: string) => /^[0-9a-fA-F]{6}$/i.test(input),
  'be a color in hexadecimal format'
);

export const draftTypeSchema = v.union(
  [v.literal('linear'), v.literal('snake')],
  'be "linear" or "snake"'
);

export const winConditionSchema = v.union(
  [v.literal('score'), v.literal('accuracy'), v.literal('combo')],
  'be "score", "accuracy" or "combo"'
);

export const tournamentLinkIconSchema = v.union(
  [
    v.literal('osu'),
    v.literal('discord'),
    v.literal('google_sheets'),
    v.literal('google_forms'),
    v.literal('google_docs'),
    v.literal('twitch'),
    v.literal('youtube'),
    v.literal('x'),
    v.literal('challonge'),
    v.literal('liquipedia'),
    v.literal('donation'),
    v.literal('website')
  ],
  'be "osu", "discord", "google_sheets", "google_forms", "google_docs", "twitch", "youtube", "x", "challonge", "liquipedia", "donation" or "website"'
);

// Schemas below this do not require error messages to be set

export const refereeSettingsSchema = v.object({
  timerLength: v.object({
    pick: v.number([v.integer(), v.minValue(1), v.maxValue(600)]),
    ban: v.number([v.integer(), v.minValue(1), v.maxValue(600)]),
    protect: v.number([v.integer(), v.minValue(1), v.maxValue(600)]),
    ready: v.number([v.integer(), v.minValue(1), v.maxValue(600)]),
    start: v.number([v.integer(), v.minValue(1), v.maxValue(600)])
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
  label: v.string([v.minLength(2), v.maxLength(30)]),
  url: v.string([v.url()]),
  icon: tournamentLinkIconSchema
});

export const bwsValuesSchema = v.object({
  x: v.number([v.notValue(0), v.minValue(-10), v.maxValue(10)]),
  y: v.number([v.notValue(0), v.minValue(-10), v.maxValue(10)]),
  z: v.number([v.notValue(0), v.minValue(-10), v.maxValue(10)])
});

export const teamSettingsSchema = v.object({
  minTeamSize: v.number([v.integer(), v.minValue(1), v.maxValue(16)]),
  maxTeamSize: v.number([v.integer(), v.minValue(1), v.maxValue(16)]),
  useTeamBanners: v.boolean()
});

export const tournamentOtherDatesSchema = v.object({
  label: v.string([v.minLength(2), v.maxLength(35)]),
  onlyDate: v.boolean(),
  fromDate: v.number([
    v.minValue(oldestDatePossible.getTime()),
    v.maxValue(maxPossibleDate.getTime())
  ]),
  toDate: v.nullable(
    v.number([v.minValue(oldestDatePossible.getTime()), v.maxValue(maxPossibleDate.getTime())])
  )
});

export const rankRangeSchema = v.object({
  lower: v.number([v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER)]),
  upper: v.nullable(v.number([v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER)]))
});

export const modMultiplierSchema = v.union([
  v.object({
    /** Easy, Hidden, Hard Rock, Flashlight, Blinds */
    mods: v.array(
      v.union([
        v.literal('ez'),
        v.literal('hd'),
        v.literal('hr'),
        v.literal('fl'),
        v.literal('bl')
      ]),
      [v.minLength(1), v.maxLength(5)]
    ),
    multiplier: v.number([v.minValue(-5), v.maxValue(5)])
  }),
  v.object({
    /** Sudden Death, Perfect */
    mods: v.array(
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
      ]),
      [v.minLength(1), v.maxLength(5)]
    ),
    multiplier: v.object({
      ifSuccessful: v.number([v.minValue(-5), v.maxValue(5)]),
      ifFailed: v.number([v.minValue(-5), v.maxValue(5)])
    })
  })
]);

const baseUserFormFieldSchemas = {
  /** Nanoid (must be unique within the form itself, not across the entire database) */
  id: v.string([v.length(8)]),
  title: v.string([v.minLength(2), v.maxLength(200)]),
  /** Written as markdown */
  description: v.nullable(v.string([v.maxLength(300)])),
  optional: v.boolean(),
  deleted: v.boolean()
};

const baseUserFormShortTextFieldSchemas = {
  ...baseUserFormFieldSchemas,
  type: v.literal('short-text'),
  validation: v.undefined_(),
  min: v.number([v.integer(), v.minValue(0)]),
  max: v.number([v.integer(), v.maxValue(100)])
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
    value: v.string([v.minLength(1), v.maxLength(100)])
  })
]);

const baseUserFormLongTextFieldSchemas = {
  ...baseUserFormFieldSchemas,
  type: v.literal('long-text'),
  validation: v.undefined_(),
  min: v.number([v.integer(), v.minValue(0)]),
  max: v.number([v.integer(), v.maxValue(10000)])
};

const userFormLongTextFieldSchema = v.union([
  v.object(baseUserFormLongTextFieldSchemas),
  v.object({
    ...baseUserFormLongTextFieldSchemas,
    validation: v.literal('regex'),
    value: v.string([v.minLength(1), v.maxLength(100)])
  })
]);

const baseUserFormNumberFieldSchema = {
  ...baseUserFormFieldSchemas,
  type: v.literal('number'),
  validation: v.undefined_(),
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
    value: v.number([v.minValue(lower32BitIntLimit), v.maxValue(upper32BitIntLimit)])
  }),
  v.object({
    ...baseUserFormNumberFieldSchema,
    validation: v.union([v.literal('between'), v.literal('not-between')]),
    min: v.number([v.minValue(lower32BitIntLimit), v.maxValue(upper32BitIntLimit)]),
    max: v.number([v.minValue(lower32BitIntLimit), v.maxValue(upper32BitIntLimit)])
  })
]);

const userFormSelectFieldSchema = v.object({
  ...baseUserFormFieldSchemas,
  type: v.literal('select'),
  options: v.array(v.string([v.minLength(1), v.maxLength(100)]), [v.minLength(2), v.maxLength(100)])
});

const userFormCheckboxFieldSchema = v.object({
  ...baseUserFormFieldSchemas,
  type: v.literal('checkbox'),
  check: v.boolean()
});

const baseUserFormSelectMultipleFieldSchema = {
  ...baseUserFormFieldSchemas,
  type: v.literal('select-multiple'),
  validation: v.undefined_(),
  options: v.array(v.string([v.minLength(1), v.maxLength(100)]), [v.minLength(2), v.maxLength(100)])
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
    value: v.number([v.integer(), v.minValue(0), v.maxValue(100)])
  }),
  v.object({
    ...baseUserFormSelectMultipleFieldSchema,
    validation: v.union([v.literal('between'), v.literal('not-between')]),
    min: v.number([v.integer(), v.minValue(0), v.maxValue(100)]),
    max: v.number([v.integer(), v.minValue(0), v.maxValue(100)])
  })
]);

const userFormScaleFieldSchema = v.object({
  ...baseUserFormFieldSchemas,
  type: v.literal('scale'),
  from: v.number([v.integer(), v.minValue(0), v.maxValue(1)]),
  fromLabel: v.string([v.minLength(1), v.maxLength(100)]),
  to: v.number([v.integer(), v.minValue(2), v.maxValue(10)]),
  toLabel: v.string([v.minLength(1), v.maxLength(100)])
});

const baseUserFormDateTimeFieldSchemas = {
  ...baseUserFormFieldSchemas,
  type: v.literal('datetime'),
  onlyDate: v.boolean(),
  validation: v.undefined_()
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
    value: v.number([
      v.minValue(oldestDatePossible.getTime()),
      v.maxValue(maxPossibleDate.getTime())
    ])
  }),
  v.object({
    ...baseUserFormDateTimeFieldSchemas,
    validation: v.union([v.literal('between'), v.literal('not-between')]),
    min: v.number([
      v.minValue(oldestDatePossible.getTime()),
      v.maxValue(maxPossibleDate.getTime())
    ]),
    max: v.number([v.minValue(oldestDatePossible.getTime()), v.maxValue(maxPossibleDate.getTime())])
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

v.record(v.string([v.length(8)]), v.string([v.minLength(0), v.maxLength(10000)]));

export const userFormFieldResponseSchema = v.record(
  v.string([v.length(8)]),
  v.string([v.minLength(0), v.maxLength(10000)])
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
    surface: v.record(colorShadesSchema, v.string([hexColorSchema])),
    primary: v.record(colorShadesSchema, v.string([hexColorSchema]))
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

export const blogPostSchema = v.object({
  id: v.number(),
  title: v.string(),
  slug: v.string(),
  preview: v.string(),
  tags: v.array(v.string()),
  published_at: v.string(),
  authors: v.array(v.string())
});

export const blogAuthorsSchema = v.record(v.string(), v.string());

export const blogTagsSchema = v.record(v.string(), v.object({
  name: v.string(),
  slug: v.string()
}));
