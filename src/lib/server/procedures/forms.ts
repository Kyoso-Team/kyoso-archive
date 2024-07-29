import { t } from '$trpc';
import { rateLimitMiddleware } from '$trpc/middleware';
import { type Infer, wrap } from '@typeschema/valibot';
import * as v from 'valibot';
import { TRPCChecks } from '$lib/server/helpers/checks';
import { getSession, getStaffMember, getTournament } from '$lib/server/helpers/trpc';
import {
  db,
  Form,
  FormResponse,
  Player,
  Team,
  Tournament,
  TournamentForm,
  TournamentFormTarget,
  TournamentFormType
} from '$db';
import { isDatePast, pick, trpcUnknownError } from '$lib/server/utils';
import { positiveIntSchema, userFormFieldResponseSchema, userFormFieldSchema } from '$lib/schemas';
import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { getCount } from '$lib/server/helpers/queries';
import { nonEmptyStringSchema } from '$lib/env';
import { maxPossibleDate, oldestDatePossible } from '$lib/constants';
import type { Context } from '$trpc/context';
import { checkPublicForm, userFormFieldsChecks } from '$lib/helpers';
import { difference, intersection, isNil } from 'lodash';
import type { UserFormField } from '$types';
import { arraysHaveSameElements } from '$lib/utils';

const formSchema = v.object({
  anonymousResponses: v.boolean(),
  title: v.string([v.minLength(1), v.maxLength(100)])
});

const tournamentFormSchema = v.object({
  ...formSchema.entries,
  type: v.picklist(TournamentFormType.enumValues),
  target: v.picklist(TournamentFormTarget.enumValues),
  tournamentId: positiveIntSchema
});

const formUpdateSchema = v.object({
  formId: positiveIntSchema,
  data: v.partial(
    v.object({
      ...v.omit(tournamentFormSchema, ['type']).entries,
      description: nonEmptyStringSchema,
      public: v.boolean(),
      closeAt: v.nullable(v.date([v.minValue(oldestDatePossible), v.maxValue(maxPossibleDate)])),
      thanksMessage: nonEmptyStringSchema,
      closedMessage: nonEmptyStringSchema,
      fields: v.array(userFormFieldSchema)
    })
  )
});

export type FormUpdateSchemaData = Infer<typeof formUpdateSchema>['data'];

const checkTournamentFormUpdate = async (
  ctx: Context,
  input: Infer<typeof formUpdateSchema>,
  formType: Infer<typeof tournamentFormSchema.entries.type>
) => {
  const { data } = input;
  const checks = new TRPCChecks({ action: 'update a tournament form' });
  const session = getSession(ctx.cookies, true);
  const staffMember = await getStaffMember(session, data.tournamentId!, true);
  checks.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

  const tournament = await getTournament(
    data.tournamentId!,
    { tournament: ['deletedAt'], dates: ['concludesAt', 'staffRegsCloseAt'] },
    true
  );

  checks.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

  if (formType === 'staff_registration' && isDatePast(tournament.staffRegsCloseAt)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Tournament staff registrations are closed, form cannot be updated'
    });
  }

  if (data.fields) {
    const checksErr = userFormFieldsChecks(data.fields);

    if (checksErr) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: checksErr
      });
    }
  }
};

const checkFieldResponseIds = (
  fieldResponses: Record<string, string>[],
  formFields: typeof Form.$inferSelect.fields
) => {
  const fieldResponsesKeys = fieldResponses.map((response) => Object.keys(response)).flat(1);
  const formFieldsIds = formFields
    .map((field) => {
      if (!field.deleted) {
        return field.id;
      }
    })
    .filter((val) => !isNil(val));

  if (!arraysHaveSameElements(fieldResponsesKeys, formFieldsIds)) {
    throw new TRPCError({
      code: 'UNPROCESSABLE_CONTENT',
      message: 'Disparity between response keys and field IDs'
    });
  }
};

const createForm = t.procedure
  .use(rateLimitMiddleware)
  .input(wrap(formSchema))
  .mutation(async ({ ctx, input }) => {
    const checks = new TRPCChecks({ action: 'create a form' });
    const session = getSession(ctx.cookies, true);
    checks.userIsAdmin(session);

    try {
      return await db
        .insert(Form)
        .values({
          ...input
        })
        .returning({
          id: Form.id
        })
        .then((rows) => rows[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Creating a form');
    }
  });

const createTournamentForm = t.procedure
  .use(rateLimitMiddleware)
  .input(wrap(tournamentFormSchema))
  .mutation(async ({ ctx, input }) => {
    const { tournamentId, type, target, ...formData } = input;
    const checks = new TRPCChecks({ action: 'create a tournament form' });
    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);
    checks.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

    const tournament = await getTournament(
      tournamentId,
      { tournament: ['deletedAt'], dates: ['concludesAt', 'staffRegsCloseAt'] },
      true
    );

    checks.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

    if (type === 'staff_registration') {
      if (tournament.staffRegsCloseAt && isDatePast(tournament.staffRegsCloseAt)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tournament staff registrations are closed, form cannot be created'
        });
      }
    }

    const [generalFormsCount, staffRegistrationFormsCount] = await Promise.all([
      getCount(TournamentForm, eq(TournamentForm.type, 'general')),
      getCount(TournamentForm, eq(TournamentForm.type, 'staff_registration'))
    ]);

    if (
      (type === 'general' && generalFormsCount === 5) ||
      (type === 'staff_registration' && staffRegistrationFormsCount === 5)
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Tournament can only have up to 5 general/staff registration forms'
      });
    }

    return await db.transaction(async (tx) => {
      const form = await tx
        .insert(Form)
        .values({
          ...formData,
          anonymousResponses: type === 'staff_registration' ? false : formData.anonymousResponses
        })
        .returning(pick(Form, ['id']))
        .then((rows) => rows[0]);

      await tx.insert(TournamentForm).values({
        tournamentId,
        formId: form.id,
        type,
        target: type === 'staff_registration' ? 'public' : target
      });

      return form;
    });
  });

const updateForm = t.procedure.input(wrap(formUpdateSchema)).mutation(async ({ ctx, input }) => {
  const { formId, data } = input;
  const checks = new TRPCChecks({ action: 'update a form' });

  let form: typeof Form.$inferSelect;
  let tournamentForm: typeof TournamentForm.$inferSelect | null;

  try {
    form = await db
      .select()
      .from(Form)
      .where(eq(Form.id, formId))
      .limit(1)
      .then((rows) => rows[0]);

    tournamentForm = await db
      .select()
      .from(TournamentForm)
      .where(eq(TournamentForm.formId, formId))
      .limit(1)
      .then((rows) => rows[0]);
  } catch (err) {
    throw trpcUnknownError(err, 'Getting forms');
  }

  if (form.deletedAt) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Form is deleted, cannot be updated'
    });
  }

  checks.partialHasValues(data);

  if (form.public) {
    const error = checkPublicForm(data);

    if (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error
      });
    }
  }

  let updatedFormFields: UserFormField[] | undefined;

  if (data.fields) {
    const errors = userFormFieldsChecks(data.fields);

    if (errors) {
      throw new TRPCError({
        message: errors,
        code: 'BAD_REQUEST'
      });
    }

    const deletedFieldIds = difference(form.fields, data.fields).map((field) => field.id);

    if (intersection(form.fieldsWithResponses, deletedFieldIds).length !== 0) {
      updatedFormFields = form.fields.map((field) => {
        if (deletedFieldIds.includes(field.id)) {
          field.deleted = true;
        }
        return field;
      });
    }
  }
  await db.transaction(async (tx) => {
    if (tournamentForm && data.tournamentId) {
      await checkTournamentFormUpdate(ctx, input, tournamentForm.type).then(async () => {
        await tx
          .update(TournamentForm)
          .set({
            tournamentId: data.tournamentId,
            target: tournamentForm.type === 'staff_registration' ? 'public' : data.target
          })
          .where(eq(TournamentForm.formId, formId));
      });
    }

    await tx
      .update(Form)
      .set({
        ...data,
        fields: updatedFormFields ?? undefined,
        anonymousResponses:
          tournamentForm && tournamentForm.type === 'staff_registration'
            ? false
            : form.anonymousResponses
      })
      .where(eq(Form.id, formId));
  });
});

const deleteForm = t.procedure
  .input(
    wrap(
      v.object({
        formId: positiveIntSchema,
        tournamentId: v.optional(positiveIntSchema)
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { formId, tournamentId } = input;

    let form: Pick<typeof Form.$inferSelect, 'deletedAt'>;
    let tournamentForm: Pick<typeof TournamentForm.$inferSelect, 'formId' | 'type'> | null;

    try {
      form = await db
        .select({
          ...pick(Form, ['deletedAt'])
        })
        .from(Form)
        .where(eq(Form.id, formId))
        .limit(1)
        .then((rows) => rows[0]);
      tournamentForm = await db
        .select({
          ...pick(TournamentForm, ['formId', 'type'])
        })
        .from(TournamentForm)
        .where(eq(TournamentForm.formId, formId))
        .innerJoin(Form, eq(TournamentForm.formId, Form.id))
        .limit(1)
        .then((rows) => rows[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting forms');
    }

    if (form.deletedAt) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Form is already deleted'
      });
    }

    if (tournamentForm && tournamentId) {
      const checks = new TRPCChecks({ action: 'delete a tournament form' });
      const session = getSession(ctx.cookies, true);
      const staffMember = await getStaffMember(session, tournamentId, true);
      checks.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

      const tournament = await getTournament(
        tournamentId,
        { tournament: ['deletedAt'], dates: ['concludesAt', 'staffRegsCloseAt'] },
        true
      );

      checks.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

      if (tournamentForm.type === 'staff_registration' && isDatePast(tournament.staffRegsCloseAt)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tournament staff registrations are closed, form cannot be deleted'
        });
      }
    }

    await db
      .update(Form)
      .set({
        deletedAt: sql`now()`
      })
      .where(eq(Form.id, formId));
  });

const submitFormResponse = t.procedure
  .input(
    wrap(
      v.object({
        formId: positiveIntSchema,
        fieldsResponses: v.array(userFormFieldResponseSchema)
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { formId, fieldsResponses } = input;
    const { cookies } = ctx;
    const session = getSession(cookies, true);

    let form: Pick<typeof Form.$inferSelect, 'fields' | 'fieldsWithResponses' | 'closeAt'>;
    let tournamentForm: typeof TournamentForm.$inferSelect | null;

    try {
      form = await db
        .select({
          ...pick(Form, ['fields', 'fieldsWithResponses', 'closeAt'])
        })
        .from(Form)
        .where(eq(Form.id, formId))
        .then((rows) => rows[0]);
      tournamentForm = await db
        .select()
        .from(TournamentForm)
        .where(eq(TournamentForm.formId, formId))
        .limit(1)
        .then((rows) => rows[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting a forms');
    }

    if (form.closeAt && isDatePast(form.closeAt)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Form is closed, cannot submit new responses'
      });
    }

    checkFieldResponseIds(fieldsResponses, form.fields);

    if (tournamentForm) {
      const checks = new TRPCChecks({ action: 'submit a tournament form response' });

      const tournament = await getTournament(
        tournamentForm.tournamentId,
        { tournament: ['deletedAt', 'type'], dates: ['concludesAt', 'staffRegsCloseAt'] },
        true
      );

      checks.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

      if (tournamentForm.type === 'staff_registration') {
        if (tournament.staffRegsCloseAt && isDatePast(tournament.staffRegsCloseAt)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Tournament staff registration has been concluded, form cannot be created'
          });
        }
      }

      if (tournamentForm.target === 'staff') {
        const staffMember = await getStaffMember(session, tournamentForm.tournamentId, true);

        if (!staffMember) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only tournament staff can respond to this form!'
          });
        }
      }

      let player: Pick<typeof Player.$inferSelect, 'id'> | null;

      try {
        player = await db
          .select({
            ...pick(Player, ['id'])
          })
          .from(Player)
          .where(
            and(eq(Tournament.id, tournamentForm.tournamentId), eq(Player.userId, session.userId))
          )
          .limit(1)
          .then((rows) => rows[0]);
      } catch (error) {
        throw trpcUnknownError(error, 'Getting a player');
      }

      if (tournamentForm.target === 'players') {
        if (!player) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only tournament players can respond to this form!'
          });
        }
      }

      if (tournamentForm.target === 'team_captains' && tournament.type !== 'solo') {
        if (!player) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only tournament players can respond to this form!'
          });
        }

        /* Looking for a team with current user as a team captain.
         * If there's no such team, then the user cannot respond to this form
         */
        let team: Pick<typeof Team.$inferSelect, 'id'> | null;

        try {
          team = await db
            .select({
              ...pick(Team, ['id'])
            })
            .from(Team)
            .where(
              and(
                eq(Tournament.id, tournamentForm.tournamentId),
                eq(Team.captainPlayerId, player.id)
              )
            )
            .limit(1)
            .then((rows) => rows[0]);
        } catch (error) {
          throw trpcUnknownError(error, 'Getting a team');
        }

        if (!team) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only team captains can respond to this form!'
          });
        }
      }
    }

    await db.transaction(async (tx) => {
      const fieldResponseIds = fieldsResponses.map((response) => Object.keys(response)).flat();

      const fieldsWithResponses = Array.from(
        new Set([...form.fieldsWithResponses, ...fieldResponseIds])
      );

      await tx.insert(FormResponse).values({
        formId,
        fieldResponses: fieldsResponses,
        submittedByUserId: session.userId
      });

      await tx
        .update(Form)
        .set({
          fieldsWithResponses
        })
        .where(eq(Form.id, formId));
    });
  });

export const formsRouter = t.router({
  createForm,
  createTournamentForm,
  updateForm,
  deleteForm,
  submitFormResponse
});
