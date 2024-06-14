import { t } from '$trpc';
import { rateLimitMiddleware } from '$trpc/middleware';
import { wrap } from '@typeschema/valibot';
import * as v from 'valibot';
import { TRPCChecks } from '$lib/server/helpers/checks';
import { getSession, getStaffMember, getTournament } from '$lib/server/helpers/trpc';
import { db, Form, TournamentForm, TournamentFormTarget, TournamentFormType } from '$db';
import { isDatePast, pick, trpcUnknownError } from '$lib/server/utils';
import { positiveIntSchema, userFormFieldSchema } from '$lib/schemas';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { getCount } from '$lib/server/helpers/queries';

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

export const formsRouter = t.router({ createForm, createTournamentForm });
