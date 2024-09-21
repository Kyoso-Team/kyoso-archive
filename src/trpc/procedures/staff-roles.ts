import { TRPCError } from '@trpc/server';
import { wrap } from '@typeschema/valibot';
import { and, eq, gt, inArray, sql } from 'drizzle-orm';
import * as v from 'valibot';
import { StaffColor, StaffPermission, StaffRole } from '$db';
import { uniqueConstraints } from '$db/constants';
import { checks } from '$lib/server/checks';
import { getSession, getStaffMember, getTournament } from '$lib/server/context';
import { getCount } from '$lib/server/queries';
import { db, trpc } from '$lib/server/services';
import { catchUniqueConstraintError$, pick, trpcUnknownError } from '$lib/server/utils';
import { arraysHaveSameElements } from '$lib/utils';
import { positiveIntSchema } from '$lib/validation';
import { rateLimitMiddleware } from '$trpc/middleware';

const DEFAULT_ROLES = ['Host', 'Debugger'];

const DISALLOWED_PROPERTIES = ['name', 'permissions'];

const catchUniqueConstraintError = catchUniqueConstraintError$([
  {
    name: uniqueConstraints.staffRoles.nameTournamentId,
    message: "The staff role's name must be unique"
  }
]);

const createStaffRole = trpc.procedure
  .use(rateLimitMiddleware)
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
    const session = getSession('trpc', ctx.cookies, true);
    const staffMember = await getStaffMember('trpc', session, tournamentId, true);
    checks.trpc.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

    const tournament = await getTournament(
      'trpc',
      tournamentId,
      {
        tournament: ['deletedAt'],
        dates: ['concludesAt']
      },
      true
    );
    checks.trpc.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

    let staffRolesCount!: number;

    try {
      staffRolesCount =
        (await getCount(StaffRole, eq(StaffRole.tournamentId, tournamentId))) -
        DEFAULT_ROLES.length;
    } catch (err) {
      throw trpcUnknownError(err, 'Getting amount of staff roles');
    }

    if (staffRolesCount >= 25) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: "You can't have more than 25 staff roles per tournament"
      });
    }

    try {
      await db.insert(StaffRole).values({
        name,
        tournamentId,
        order: staffRolesCount + 6
      });
    } catch (err) {
      const uqErr = catchUniqueConstraintError(err);
      if (uqErr) return uqErr;
      throw trpcUnknownError(err, 'Creating the staff role');
    }
  });

const updateStaffRole = trpc.procedure
  .use(rateLimitMiddleware)
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
    checks.trpc.partialHasValues(data);

    const session = getSession('trpc', ctx.cookies, true);
    const staffMember = await getStaffMember('trpc', session, tournamentId, true);
    checks.trpc.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

    const tournament = await getTournament(
      'trpc',
      tournamentId,
      {
        tournament: ['deletedAt'],
        dates: ['concludesAt']
      },
      true
    );
    checks.trpc.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

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

const swapStaffRoleOrder = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        tournamentId: positiveIntSchema,
        swaps: v.array(
          v.object({
            source: positiveIntSchema,
            target: positiveIntSchema
          }),
          [v.maxLength(25)]
        )
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { tournamentId, swaps } = input;
    const session = getSession('trpc', ctx.cookies, true);
    const staffMember = await getStaffMember('trpc', session, tournamentId, true);
    checks.trpc.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

    const tournament = await getTournament(
      'trpc',
      tournamentId,
      {
        tournament: ['deletedAt'],
        dates: ['concludesAt']
      },
      true
    );
    checks.trpc.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

    const filteredSwaps = swaps.reduce(
      (acc, curr) => {
        if (acc.some((val) => arraysHaveSameElements(Object.values(val), Object.values(curr)))) {
          return acc;
        }

        acc.push(curr);

        return acc;
      },
      [] as typeof swaps
    );

    const staffRoleIds = Array.from(
      new Set<number>(filteredSwaps.map((swap) => Object.values(swap)).flat(99))
    );

    let staffRoles: Pick<typeof StaffRole.$inferSelect, 'id' | 'name' | 'order'>[];

    try {
      staffRoles = await db
        .select(pick(StaffRole, ['id', 'name', 'order']))
        .from(StaffRole)
        .where(inArray(StaffRole.id, staffRoleIds))
        .limit(staffRoleIds.length)
        .then((res) => res);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting staff roles');
    }

    if (staffRoles.length !== staffRoleIds.length) {
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

    await db.transaction(async (tx) => {
      for (const { source, target } of filteredSwaps) {
        const [sourceStaffRole, targetStaffRole] = [
          staffRoles.find((staffRole) => staffRole.id === source)!,
          staffRoles.find((staffRole) => staffRole.id === target)!
        ];

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
      }
    });
  });

const deleteStaffRole = trpc.procedure
  .use(rateLimitMiddleware)
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
    const session = getSession('trpc', ctx.cookies, true);
    const staffMember = await getStaffMember('trpc', session, tournamentId, true);
    checks.trpc.staffHasPermissions(staffMember, ['host', 'debug', 'manage_tournament']);

    const tournament = await getTournament(
      'trpc',
      tournamentId,
      {
        tournament: ['deletedAt'],
        dates: ['concludesAt']
      },
      true
    );
    checks.trpc.tournamentNotDeleted(tournament).tournamentNotConcluded(tournament);

    let role: Pick<typeof StaffRole.$inferSelect, 'name'>;

    try {
      role = await db
        .select({
          ...pick(StaffRole, ['name'])
        })
        .from(StaffRole)
        .where(eq(StaffRole.id, staffRoleId))
        .limit(1)
        .then((rows) => rows[0]);
    } catch (e) {
      throw trpcUnknownError(e, 'Getting staff role');
    }

    if (DEFAULT_ROLES.includes(role.name)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot delete default role'
      });
    }

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

export const staffRolesRouter = trpc.router({
  createStaffRole,
  updateStaffRole,
  swapStaffRoleOrder,
  deleteStaffRole
});