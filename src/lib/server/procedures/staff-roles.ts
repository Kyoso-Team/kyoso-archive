import * as v from 'valibot';
import postgres from 'postgres';
import { t } from '$trpc';
import { wrap } from '@typeschema/valibot';
import { db, StaffColor, StaffPermission, StaffRole, Tournament, uniqueConstraints } from '$db';
import { count, eq, inArray, sql } from 'drizzle-orm';
import { pick, trpcUnknownError } from '$lib/server/utils';
import { positiveIntSchema } from '$lib/schemas';
import { TRPCError } from '@trpc/server';
import { getSession, getStaffMember } from '$lib/server/helpers/trpc';
import { hasPermissions } from '$lib/utils';
import type { Context } from '$trpc/context';

function uniqueConstraintsError(err: unknown) {
  if (err instanceof postgres.PostgresError && err.code === '23505') {
    const constraint = err.message.split('"')[1];

    if (constraint === uniqueConstraints.staffRoles.uniqueNameTournamentId) {
      return 'The staff role name must be unique';
    }
  }

  return undefined;
}

async function checkPermissions(ctx: Context, tournamentId?: number | undefined) {
  const session = getSession(ctx.cookies, true);

  if (tournamentId) {
    const staffMember = await getStaffMember(session, tournamentId, true);

    if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament'])) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message:
          'You do not have the required permissions to create staff roles for this tournament'
      });
    }

    return;
  }

  const tournamentSlug = ctx.url.pathname.split('/').at(-1)!;

  let tournament!: Pick<typeof Tournament.$inferSelect, 'id'>;

  try {
    tournament = await db
      .select(pick(Tournament, ['id']))
      .from(Tournament)
      .where(eq(Tournament.urlSlug, tournamentSlug))
      .limit(1)
      .then((res) => res[0]);
  } catch (err) {
    throw trpcUnknownError(err, 'Getting the tournament');
  }

  const staffMember = await getStaffMember(session, tournament.id, true);

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
        tournamentId: v.number([v.minValue(1), v.integer()])
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { name, tournamentId } = input;

    await checkPermissions(ctx, tournamentId);

    const staffRolesCount = db.$with('staff_roles_count').as(
      db
        .select({
          count: count()
        })
        .from(StaffRole)
        .where(eq(StaffRole.tournamentId, tournamentId))
    );

    let staffRole!: Pick<typeof StaffRole.$inferSelect, 'id' | 'name' | 'tournamentId' | 'order'>;

    try {
      staffRole = await db
        .with(staffRolesCount)
        .insert(StaffRole)
        .values({
          name,
          tournamentId,
          order: sql<number>`((select * from ${staffRolesCount}) + 1)`
        })
        .returning(pick(StaffRole, ['id', 'name', 'tournamentId', 'order']))
        .then((rows) => rows[0]);
    } catch (err) {
      const uqErr = uniqueConstraintsError(err);

      if (uqErr) {
        return uqErr;
      }

      throw trpcUnknownError(err, 'Creating the staff role');
    }

    return staffRole;
  });

const updateStaffRole = t.procedure
  .input(
    wrap(
      v.object({
        staffRoleId: positiveIntSchema,
        data: v.partial(
          v.object({
            name: v.string(),
            color: v.picklist(StaffColor.enumValues),
            permissions: v.array(v.picklist(StaffPermission.enumValues))
          })
        )
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    await checkPermissions(ctx);

    const { staffRoleId, data } = input;

    let staffRole: Pick<typeof StaffRole.$inferSelect, 'id'> | null;

    try {
      staffRole = await db
        .select(pick(StaffRole, ['id']))
        .from(StaffRole)
        .where(eq(StaffRole.id, staffRoleId))
        .limit(1)
        .then((res) => res[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Updating the staff role');
    }

    if (!staffRole) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Staff role not found'
      });
    }

    if (Object.keys(data || {}).length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Nothing to update'
      });
    }

    try {
      await db.update(StaffRole).set(data).where(eq(StaffRole.id, staffRoleId));
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
        source: positiveIntSchema,
        target: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    await checkPermissions(ctx);

    const { source, target } = input;

    let staffRoles: (typeof StaffRole.$inferSelect)[];

    try {
      staffRoles = await db
        .select()
        .from(StaffRole)
        .where(inArray(StaffRole.id, [source, target]))
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

    const { sourceStaffRole, targetStaffRole } = {
      sourceStaffRole: staffRoles[0],
      targetStaffRole: staffRoles[1]
    };

    await db.execute(sql`
        UPDATE staff_role
        SET "order" = CASE id
                          WHEN ${sourceStaffRole.id} THEN (SELECT "order"
                                                           FROM staff_role
                                                           WHERE id = ${targetStaffRole.id})
                          WHEN ${targetStaffRole.id} THEN (SELECT "order"
                                                           FROM staff_role
                                                           WHERE id = ${sourceStaffRole.id})
            END
        WHERE id IN (${sourceStaffRole.id}, ${targetStaffRole.id})`);
  });

const deleteStaffRole = t.procedure
  .input(
    wrap(
      v.object({
        staffRoleId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    await checkPermissions(ctx);

    const { staffRoleId } = input;

    let staffRole: Pick<typeof StaffRole.$inferSelect, 'id'> | undefined;

    try {
      staffRole = await db
        .select(pick(StaffRole, ['id']))
        .from(StaffRole)
        .where(eq(StaffRole.id, staffRoleId))
        .limit(1)
        .then((res) => res[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting staff role');
    }

    if (!staffRole) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Staff role was not found'
      });
    }

    const { id } = staffRole;

    await db.transaction(async (tx) => {
      const deletedStaffRole = await tx
        .delete(StaffRole)
        .where(eq(StaffRole.id, id))
        .returning(pick(StaffRole, ['tournamentId', 'order']))
        .then((res) => res[0]);

      await tx.execute(sql`UPDATE staff_role
                           SET "order" = "order" - 1
                           WHERE tournament_id = ${deletedStaffRole.tournamentId}
                             AND "order" > ${deletedStaffRole.order}`);
    });
  });

export const staffRolesRouter = t.router({
  createStaffRole,
  updateStaffRole,
  swapStaffRoleOrder,
  deleteStaffRole
});
