import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';
import { Tournament, TournamentFormTarget, TournamentFormType, User } from '.';
import { timestampConfig } from './constants';
import type { UserFormField, UserFormFieldResponse } from '$lib/types';

export const Form = pgTable(
  'form',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at', timestampConfig).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', timestampConfig),
    /** Date in which the form will stop accepting new responses. This field is ignored if TournamentForm.type is "staff_registration", in that case, TournamentDates.staffRegsCloseAt is used instead  */
    closeAt: timestamp('close_at', timestampConfig),
    public: boolean('public').notNull().default(false),
    anonymousResponses: boolean('anonymous_responses').notNull().default(false),
    title: varchar('name', {
      length: 100
    }).notNull(),
    /** Written as Markdown */
    description: varchar('description', { length: 2000 }),
    /** Written as Markdown */
    thanksMessage: varchar('thanks_message', { length: 1000 }),
    /** Written as Markdown */
    closedMessage: varchar('closed_message', { length: 1000 }),
    fieldsWithResponses: char('fields_with_responses', { length: 8 }).array().notNull().default([]),
    /** Limit of 20 fields (not counting soft deleted fields) */
    fields: jsonb('fields').notNull().$type<UserFormField[]>().default([])
  },
  (table) => ({
    indexDeletedAtPublicCreatedAt: index('idx_form_deleted_at_public_created_at').on(
      table.deletedAt,
      table.public,
      table.createdAt
    ),
    indexTitle: index('idx_trgm_form_title').using('gist', sql`lower(${table.title}) gist_trgm_ops`)
  })
);

export const TournamentForm = pgTable(
  'tournament_form',
  {
    formId: integer('form_id')
      .primaryKey()
      .references(() => Form.id, {
        onDelete: 'cascade'
      }),
    type: TournamentFormType('type').notNull(),
    /** Only applies if type is "general" */
    target: TournamentFormTarget('target').notNull(),
    tournamentId: integer('tournament_id')
      .notNull()
      .references(() => Tournament.id, {
        onDelete: 'cascade'
      })
  },
  (table) => ({
    indexTournamentIdType: index('idx_tournament_form_tournament_id_type').on(
      table.tournamentId,
      table.type
    )
  })
);

export const FormResponse = pgTable(
  'form_response',
  {
    id: serial('id').primaryKey(),
    submittedAt: timestamp('submitted_at', timestampConfig).notNull().defaultNow(),
    fieldResponses: jsonb('field_responses').notNull().$type<UserFormFieldResponse[]>().default([]),
    formId: integer('form_id')
      .notNull()
      .references(() => Form.id, {
        onDelete: 'cascade'
      }),
    submittedByUserId: integer('submitted_by_user_id').references(() => User.id, {
      onDelete: 'set null'
    })
  },
  (table) => ({
    indexFormIdSubmittedAt: index('idx_form_response_form_id_submitted_at').on(
      table.formId,
      table.submittedAt
    )
  })
);
