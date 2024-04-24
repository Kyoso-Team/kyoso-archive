import * as v from 'valibot';

import { t }                                from '$trpc';
import { wrap }                             from '@typeschema/valibot';
import { db, StaffRole, uniqueConstraints } from '$db';
import { count, eq, sql }                   from 'drizzle-orm';
import postgres                             from 'postgres';
import { trpcUnknownError }                 from '$lib/server/utils';

function uniqueConstraintsError(err: unknown) {
  if (err instanceof postgres.PostgresError && err.code === '23505') {
    const constraint = err.message.split('"')[1];

    if (constraint === uniqueConstraints.staffRoles.uniqueNameTournamentId) {
      return 'The staff role name must be unique';
    }
  }

  return undefined;
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
  .mutation(async ({ input }) => {
    const { name, tournamentId } = input;

    const staffRolesCount = db.$with('staff_roles_count').as(
      db
        .select({
          count: count()
        })
        .from(StaffRole)
        .where(eq(StaffRole.tournamentId, tournamentId))
    );

    let staffRole!: typeof StaffRole.$inferSelect;

    try {
      staffRole = await db.with(staffRolesCount).insert(StaffRole).values({
        name,
        tournamentId,
        order: sql<number>`((select * from ${staffRolesCount}) + 1)`
      }).returning().then((rows) => rows[0]);
    } catch (err) {
      const uqErr = uniqueConstraintsError(err);

      if (uqErr) {
        return uqErr;
      }

      throw trpcUnknownError(err, 'Creating the staff role');
    }

    return staffRole;
  });

