import { t } from '$trpc';
import { rateLimitMiddleware } from '$trpc/middleware';
import { type Infer, wrap } from '@typeschema/valibot';
import * as v from 'valibot';
import { TRPCChecks } from '$lib/server/helpers/checks';
import { getSession, getStaffMember, getTournament } from '$lib/server/helpers/trpc';
import { db, Form, TournamentForm, TournamentFormTarget, TournamentFormType } from '$db';
import { isDatePast, pick, trpcUnknownError } from '$lib/server/utils';
import { positiveIntSchema, userFormFieldSchema } from '$lib/schemas';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { getCount } from '$lib/server/helpers/queries';
import { nonEmptyStringSchema } from '$lib/env';
import { maxPossibleDate, oldestDatePossible } from '$lib/constants';
import type { Context } from '$trpc/context';
import { checkPublicForm, userFormFieldsChecks } from '$lib/helpers';
import { difference, intersection } from 'lodash';
import type { UserFormField } from '$types';

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

const handleTournamentForm = async (
  ctx: Context,
  input: Infer<typeof formUpdateSchema>,
  tournamentForm: typeof TournamentForm.$inferSelect
) => {
  const { formId, data } = input;
  const { tournamentId, target } = data;
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

  if (data.fields) {
    const checksErr = userFormFieldsChecks(data.fields);

    if (checksErr) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: checksErr
      });
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(TournamentForm)
      .set({
        tournamentId,
        target: tournamentForm.type === 'staff_registration' ? 'public' : target
      })
      .where(eq(TournamentForm.formId, formId));
  });
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
        .returning()
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
      if (tournament.staffRegsCloseAt || isDatePast(tournament.staffRegsCloseAt)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tournament staff registration has been concluded, form cannot be created'
        });
      }
    }

    const formsCount = await getCount(TournamentForm, eq(TournamentForm.type, type));

    if (formsCount === 5) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Tournament can only have up to 5 general and 5 staff registration forms'
      });
    }

    await db.transaction(async (tx) => {
      const form = await tx
        .insert(Form)
        .values({
          ...formData
        })
        .returning(pick(Form, ['id']))
        .then((rows) => rows[0]);

      await tx.insert(TournamentForm).values({
        tournamentId,
        formId: form.id,
        type,
        target: type === 'staff_registration' ? 'public' : target
      });
    });
  });

const updateForm = t.procedure.input(wrap(formUpdateSchema)).mutation(async ({ ctx, input }) => {
  const { formId, data } = input;
  const checks = new TRPCChecks({ action: 'update a form' });
  checks.partialHasValues(data);

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

  if (tournamentForm && data.tournamentId) {
    handleTournamentForm(ctx, input, tournamentForm);
  } else {
    throw new TRPCError({
      code: 'BAD_REQUEST'
    });
  }

  if (form.public) {
    const errors = checkPublicForm(data);

    if (errors.length !== 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: errors.join('\n')
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

  await db
    .update(Form)
    .set({
      ...data,
      fields: updatedFormFields ?? form.fields
    })
    .where(eq(Form.id, formId));
});

export const formsRouter = t.router({ createForm, createTournamentForm, updateForm });
