import { t } from '$trpc';
import { wrap } from '@typeschema/valibot';
import * as v from 'valibot';
import { positiveIntSchema } from '$lib/schemas';
import { nonEmptyStringSchema } from '$lib/env';
import { TRPCChecks } from '$lib/server/helpers/checks';
import { getSession, getStaffMember, getTournament, isUserBanned } from '$lib/server/helpers/trpc';
import { Ban, db, Invite, InviteWithRole, OsuUser, StaffMember, StaffRole, User } from '$db';
import { and, asc, eq, inArray, isNull, notExists, or, type SQL, sql } from 'drizzle-orm';
import { future, pick, trgmSearch, trpcUnknownError } from '$lib/server/utils';
import { rateLimitMiddleware } from '$trpc/middleware';
import { TRPCError } from '@trpc/server';
import { DEFAULT_ROLES } from '$lib/server/procedures/staff-roles';

const searchUsers = t.procedure
  .input(
    wrap(
      v.object({
        query: nonEmptyStringSchema,
        tournamentId: positiveIntSchema,
        admin: v.optional(v.boolean())
      })
    )
  )
  .query(async ({ ctx, input }) => {
    const { query, tournamentId, admin } = input;
    const checks = new TRPCChecks({ action: 'search users' });
    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);
    checks.staffHasPermissions(staffMember, ['host', 'manage_tournament']);

    const tournament = await getTournament(
      tournamentId,
      {
        tournament: ['deletedAt'],
        dates: ['concludesAt']
      },
      true
    );

    checks.tournamentNotConcluded(tournament).tournamentNotDeleted(tournament);

    const isBanned = db.$with('is_banned').as(
      db
        .select()
        .from(Ban)
        .where(
          sql`select 1
              from ${Ban}
              where ${and(
                eq(Ban.issuedToUserId, +query),
                and(isNull(Ban.revokedAt), or(isNull(Ban.liftAt), future(Ban.liftAt)))
              )}
              limit 1
          `
        )
    );

    const userWhereCondition: SQL[] = [
      eq(User.discordUserId, query),
      trgmSearch(query, [OsuUser.username])
    ];

    if (!isNaN(parseInt(query))) {
      userWhereCondition.push(eq(User.id, +query), eq(User.osuUserId, +query));
    }

    let users: (Pick<typeof User.$inferSelect, 'id' | 'osuUserId'> & {
      username: string;
    })[];

    try {
      users = await db
        .select({
          ...pick(User, ['id', 'osuUserId']),
          username: OsuUser.username
        })
        .from(User)
        .innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId))
        .where(
          and(
            notExists(isBanned),
            or(...userWhereCondition),
            admin === true ? eq(User.admin, true) : undefined
          )
        )
        .limit(20)
        .orderBy(asc(OsuUser.username));
    } catch (e) {
      throw trpcUnknownError(e, 'Searching users');
    }

    const usersIds = users.map((user) => user.id);

    let staffMemberIds: number[];

    try {
      staffMemberIds = await db
        .select(pick(StaffMember, ['userId']))
        .from(StaffMember)
        .where(
          and(eq(StaffMember.tournamentId, tournamentId), inArray(StaffMember.userId, usersIds))
        )
        .then((rows) =>
          rows.reduce<number[]>((acc, curr) => {
            if (curr.userId) {
              acc.push(curr.userId);
            }
            return acc;
          }, [])
        );
    } catch (e) {
      throw trpcUnknownError(e, 'Getting staff members');
    }

    return users.map((user) => {
      return {
        ...user,
        isStaff: staffMemberIds.includes(user.id)
      };
    });
  });

const sendJoinStaffInvite = t.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        toUserId: positiveIntSchema,
        tournamentId: positiveIntSchema,
        staffRoleIds: v.array(positiveIntSchema)
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { tournamentId, staffRoleIds, toUserId } = input;
    if (staffRoleIds.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No staff roles were provided'
      });
    }
    const checks = new TRPCChecks({ action: 'search users' });
    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);
    checks.staffHasPermissions(staffMember, ['host', 'manage_tournament']);

    const tournament = await getTournament(
      tournamentId,
      {
        tournament: ['deletedAt'],
        dates: ['concludesAt']
      },
      true
    );

    checks.tournamentNotConcluded(tournament).tournamentNotDeleted(tournament);

    if (await isUserBanned(toUserId)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot invite banned user as staff member'
      });
    }

    let staffRoles: Pick<typeof StaffRole.$inferSelect, 'id' | 'name' | 'permissions'>[];

    try {
      staffRoles = await db
        .select(pick(StaffRole, ['id', 'name', 'permissions']))
        .from(StaffRole)
        .where(eq(StaffRole.tournamentId, tournamentId))
        .then((res) => res);
    } catch (e) {
      throw trpcUnknownError(e, 'Getting staff roles');
    }

    if (staffRoles.length < staffRoleIds.length) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Each staff role must be a role within that tournament'
      });
    }

    if (staffRoles.some((staffRole) => DEFAULT_ROLES.includes(staffRole.name))) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot assign given roles'
      });
    }

    if (
      staffRoles.some((staffRole) => staffRole.permissions.includes('manage_tournament')) &&
      !staffMember.permissions.includes('host')
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Only the host can assign a role with tournament management permissions'
      });
    }

    await db.transaction(async (tx) => {
      const invite = await tx
        .insert(Invite)
        .values({
          tournamentId,
          reason: 'join_staff',
          toUserId,
          byUserId: session.userId
        })
        .returning({
          id: Invite.id
        })
        .then((res) => res[0]);

      const values: (typeof InviteWithRole.$inferSelect)[] = staffRoleIds.map((staffRoleId) => ({
        inviteId: invite.id,
        staffRoleId
      }));

      await tx.insert(InviteWithRole).values(values);
    });
  });

const sendDebuggerInvite = t.procedure
  .input(
    wrap(
      v.object({
        toUserId: positiveIntSchema,
        tournamentId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { tournamentId, toUserId } = input;

    const checks = new TRPCChecks({ action: 'search users' });
    const session = getSession(ctx.cookies, true);
    const staffMember = await getStaffMember(session, tournamentId, true);
    checks.staffHasPermissions(staffMember, ['host']);

    const tournament = await getTournament(
      tournamentId,
      {
        tournament: ['deletedAt'],
        dates: ['concludesAt']
      },
      true
    );

    checks.tournamentNotConcluded(tournament).tournamentNotDeleted(tournament);

    if (await isUserBanned(toUserId)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot invite banned user as staff member'
      });
    }

    await db.transaction(async (tx) => {
      const role = await tx
        .select(pick(StaffRole, ['id']))
        .from(StaffRole)
        .where(and(eq(StaffRole.tournamentId, tournamentId), eq(StaffRole.name, 'Debugger')))
        .then((res) => res[0]);

      const invite = await tx
        .insert(Invite)
        .values({
          tournamentId,
          reason: 'join_staff',
          toUserId,
          byUserId: session.userId
        })
        .returning({
          id: Invite.id
        })
        .then((res) => res[0]);

      await tx.insert(InviteWithRole).values({
        inviteId: invite.id,
        staffRoleId: role.id
      });
    });
  });

export const staffMembersRouter = t.router({
  searchUsers,
  sendJoinStaffInvite,
  sendDebuggerInvite
});
