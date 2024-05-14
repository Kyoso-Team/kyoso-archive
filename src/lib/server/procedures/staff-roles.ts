import * as v from 'valibot';
import { t } from '$trpc';
import { wrap } from '@typeschema/valibot';
import { db, StaffColor, StaffPermission, StaffRole, uniqueConstraints } from '$db';
import { and, eq, gt, inArray, sql } from 'drizzle-orm';
import { catchUniqueConstraintError$, pick, trpcUnknownError } from '$lib/server/utils';
import { positiveIntSchema } from '$lib/schemas';
import { TRPCError } from '@trpc/server';
import { getSession, getStaffMember, getTournament } from '$lib/server/helpers/trpc';
import { TRPCChecks } from '../helpers/checks';

const DEFAULT_ROLES = ['Host', 'Debugger'];

const DISALLOWED_PROPERTIES = ['name', 'permissions'];

const catchUniqueConstraintError = catchUniqueConstraintError$([
  {
    name: uniqueConstraints.staffRoles.nameTournamentId,
    message: "The staff role's name must be unique"
  }
]);

const createStaffRole = t.procedure
  .input(
    wrap(
      v.object({
        name: v.string([v.minLength(2), v.maxLength(50)]),
        tournamentId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { name, tournamentId } = input;
    const checks = new TRPCChecks({ action: 'create a staff role for this tournament' });
    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);
    checks.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

    const tournament = await getTournament(
      tournamentId,
      {
        tournament: ['deleted'],
        dates: ['concludesAt']
      },
      true
    );
    checks.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

    const staffRolesCount = db.$with('staff_roles_count').as(
      db
        .select({
          count: sql<number>`count
              (*)
              + 1`
            .mapWith(Number)
            .as('count')
        })
        .from(StaffRole)
        .where(eq(StaffRole.tournamentId, tournamentId))
    );

    try {
      await db
        .with(staffRolesCount)
        .insert(StaffRole)
        .values({
          name,
          tournamentId,
          order: sql<number>`select *
                             from ${staffRolesCount}`
        })
        .then((rows) => rows[0]);
    } catch (err) {
      const uqErr = catchUniqueConstraintError(err);
      if (uqErr) return uqErr;
      throw trpcUnknownError(err, 'Creating the staff role');
    }
  });

const updateStaffRole = t.procedure
  .input(
    wrap(
      v.object({
        tournamentId: positiveIntSchema,
        staffRoleId: positiveIntSchema,
        data: v.partial(
          v.object({
            name: v.string([v.minLength(2), v.maxLength(50)]),
            color: v.picklist(StaffColor.enumValues),
            permissions: v.array(v.picklist(StaffPermission.enumValues))
          })
        )
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { staffRoleId, tournamentId, data } = input;
    const checks = new TRPCChecks({ action: 'update this staff role' });
    checks.partialHasValues(data);

    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);
    checks.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

    const tournament = await getTournament(
      tournamentId,
      {
        tournament: ['deleted'],
        dates: ['concludesAt']
      },
      true
    );
    checks.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

    let staffRole!: Pick<typeof StaffRole.$inferSelect, 'id' | 'name'>;

    try {
      staffRole = await db
        .select(pick(StaffRole, ['id', 'name']))
        .from(StaffRole)
        .limit(1)
        .where(eq(StaffRole.id, staffRoleId))
        .then((rows) => rows[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting the staff role for update');
    }

    if (
      DEFAULT_ROLES.includes(staffRole.name) &&
      Object.keys(data || {}).some((key) => DISALLOWED_PROPERTIES.includes(key))
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot modify any properties for default roles except color'
      });
    }

    try {
      await db.update(StaffRole).set(data).where(eq(StaffRole.id, staffRole.id));
    } catch (err) {
      const uqErr = catchUniqueConstraintError(err);
      if (uqErr) return uqErr;
      throw trpcUnknownError(err, 'Updating the staff role');
    }
  });

const swapStaffRoleOrder = t.procedure
  .input(
    wrap(
      v.object({
        tournamentId: positiveIntSchema,
        source: positiveIntSchema,
        target: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { tournamentId, source, target } = input;
    const checks = new TRPCChecks({ action: 'swap the order of these staff roles' });
    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);
    checks.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

    const tournament = await getTournament(
      tournamentId,
      {
        tournament: ['deleted'],
        dates: ['concludesAt']
      },
      true
    );
    checks.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

    let staffRoles: (typeof StaffRole.$inferSelect)[];

    try {
      staffRoles = await db
        .select()
        .from(StaffRole)
        .where(inArray(StaffRole.id, [source, target]))
        .limit(2)
        .then((res) => res);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting staff roles');
    }

    if (staffRoles.length !== 2) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Source/target staff roles were not found'
      });
    }

    if (staffRoles.some((staffRole) => DEFAULT_ROLES.includes(staffRole.name))) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: "Can't swap the order of a default role"
      });
    }

    const [sourceStaffRole, targetStaffRole] = staffRoles;

    await db.transaction(async (tx) => {
      await tx
        .update(StaffRole)
        .set({
          order: targetStaffRole.order
        })
        .where(eq(StaffRole.id, sourceStaffRole.id));

      await tx
        .update(StaffRole)
        .set({
          order: sourceStaffRole.order
        })
        .where(eq(StaffRole.id, targetStaffRole.id));
    });
  });

const deleteStaffRole = t.procedure
  .input(
    wrap(
      v.object({
        tournamentId: positiveIntSchema,
        staffRoleId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { tournamentId, staffRoleId } = input;
    const checks = new TRPCChecks({ action: 'delete this staff role' });
    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);
    checks.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

    const tournament = await getTournament(
      tournamentId,
      {
        tournament: ['deleted'],
        dates: ['concludesAt']
      },
      true
    );
    checks.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

    await db.transaction(async (tx) => {
      const deletedStaffRole = await tx
        .delete(StaffRole)
        .where(eq(StaffRole.id, staffRoleId))
        .returning(pick(StaffRole, ['order']))
        .then((res) => res[0]);

      await tx
        .update(StaffRole)
        .set({
          order: sql<number>`${StaffRole.order} - 1`
        })
        .where(
          and(eq(StaffRole.tournamentId, tournamentId), gt(StaffRole.order, deletedStaffRole.order))
        );
    });
  });

export const staffRolesRouter = t.router({
  createStaffRole,
  updateStaffRole,
  swapStaffRoleOrder,
  deleteStaffRole
});
