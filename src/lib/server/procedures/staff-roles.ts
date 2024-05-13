import * as v from 'valibot';
import postgres from 'postgres';
import { t } from '$trpc';
import { wrap } from '@typeschema/valibot';
import {
  db,
  StaffColor,
  StaffPermission,
  StaffRole,
  TournamentDates,
  uniqueConstraints
} from '$db';
import { and, eq, exists, gt, inArray, sql } from 'drizzle-orm';
import { past, pick, trpcUnknownError } from '$lib/server/utils';
import { positiveIntSchema } from '$lib/schemas';
import { TRPCError } from '@trpc/server';
import { getSession, getStaffMember } from '$lib/server/helpers/trpc';
import { hasPermissions } from '$lib/utils';
import type { Context } from '$trpc/context';

const DEFAULT_ROLES = ['Host', 'Debugger'];

const DISALLOWED_PROPERTIES = ['name', 'permissions'];

function uniqueConstraintsError(err: unknown) {
  if (err instanceof postgres.PostgresError && err.code === '23505') {
    const constraint = err.message.split('"')[1];

    if (constraint === uniqueConstraints.staffRoles.uniqueNameTournamentId) {
      return "The staff role's name must be unique";
    }
  }

  return undefined;
}

async function checkTournamentConclusion(tournamentId: number) {
  const concluded = await db
    .select(pick(TournamentDates, ['concludesAt']))
    .from(TournamentDates)
    .where(
      and(eq(TournamentDates.tournamentId, tournamentId), exists(past(TournamentDates.concludesAt)))
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (concluded) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message:
        "This tournament has concluded. You can't create, update or delete any data related to this tournament"
    });
  }
}

async function checkPermissions(ctx: Context, tournamentId: number) {
  const session = getSession(ctx.cookies, true);

  const staffMember = await getStaffMember(session, tournamentId, true);

  if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament'])) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You do not have the required permissions to create staff roles for this tournament'
    });
  }
}

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

    await checkPermissions(ctx, tournamentId);
    await checkTournamentConclusion(tournamentId);

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
      const uqErr = uniqueConstraintsError(err);

      if (uqErr) {
        return uqErr;
      }

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

    await checkPermissions(ctx, tournamentId);
    await checkTournamentConclusion(tournamentId);

    const updateData = Object.keys(data || {});

    if (updateData.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Nothing to update'
      });
    }

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
      updateData.some((key) => DISALLOWED_PROPERTIES.includes(key))
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot modify any properties for default roles except color'
      });
    }

    try {
      await db.update(StaffRole).set(data).where(eq(StaffRole.id, staffRole.id));
    } catch (err) {
      const uqErr = uniqueConstraintsError(err);

      if (uqErr) {
        return uqErr;
      }

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

    await checkPermissions(ctx, tournamentId);
    await checkTournamentConclusion(tournamentId);

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
        message: 'Cannot perform order swap with a default role'
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

    await checkPermissions(ctx, tournamentId);
    await checkTournamentConclusion(tournamentId);

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
