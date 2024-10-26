import { TRPCError } from '@trpc/server';
import { and, asc, eq, inArray, isNotNull, isNull, notExists, or, sql } from 'drizzle-orm';
import * as v from 'valibot';
import {
  Ban,
  Invite,
  InviteWithRole,
  OsuUser,
  StaffMember,
  StaffMemberRole,
  StaffRole,
  User
} from '$db';
import { checks } from '$lib/server/checks';
import { getSession, getStaffMember, getTournament } from '$lib/server/context';
import { isUserBanned } from '$lib/server/queries';
import { db, trpc } from '$lib/server/services';
import { future, past, trgmSearch } from '$lib/server/sql';
import { pick, trpcUnknownError } from '$lib/server/utils';
import { nonEmptyStringSchema, positiveIntSchema } from '$lib/validation';
import { rateLimitMiddleware } from '$trpc/middleware';
import { DEFAULT_ROLES } from '$trpc/procedures/staff-roles';
import type { SQL } from 'drizzle-orm';

const searchUsers = trpc.procedure
  .input(
    v.parser(
      v.object({
        query: nonEmptyStringSchema,
        tournamentId: positiveIntSchema,
        admin: v.optional(v.boolean())
      })
    )
  )
  .query(async ({ ctx, input }) => {
    const { query, tournamentId, admin } = input;
    const session = getSession('trpc', ctx.cookies, true);
    const staffMember = await getStaffMember('trpc', session, tournamentId, true);
    checks.trpc.staffHasPermissions(staffMember, ['host', 'manage_tournament']);

    const tournament = await getTournament(
      'trpc',
      tournamentId,
      {
        tournament: ['deletedAt'],
        dates: ['concludesAt']
      },
      true
    );

    checks.trpc.tournamentNotConcluded(tournament).tournamentNotDeleted(tournament);

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

const sendJoinStaffInvite = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    v.parser(
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
    const session = getSession('trpc', ctx.cookies, true);
    const staffMember = await getStaffMember('trpc', session, tournamentId, true);
    checks.trpc.staffHasPermissions(staffMember, ['host', 'manage_tournament']);

    const tournament = await getTournament(
      'trpc',
      tournamentId,
      {
        tournament: ['deletedAt'],
        dates: ['concludesAt']
      },
      true
    );

    checks.trpc.tournamentNotConcluded(tournament).tournamentNotDeleted(tournament);

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

const sendDebuggerInvite = trpc.procedure
  .input(
    v.parser(
      v.object({
        toUserId: positiveIntSchema,
        tournamentId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { tournamentId, toUserId } = input;

    const session = getSession('trpc', ctx.cookies, true);
    const staffMember = await getStaffMember('trpc', session, tournamentId, true);
    checks.trpc.staffHasPermissions(staffMember, ['host']);

    const tournament = await getTournament(
      'trpc',
      tournamentId,
      {
        tournament: ['deletedAt'],
        dates: ['concludesAt']
      },
      true
    );

    checks.trpc.tournamentNotConcluded(tournament).tournamentNotDeleted(tournament);

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

const acceptJoinStaffInvite = trpc.procedure
  .input(
    v.parser(
      v.object({
        inviteId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ input, ctx }) => {
    const { inviteId } = input;

    const session = getSession('trpc', ctx.cookies, true);

    const invite = await db
      .select(pick(Invite, ['id', 'tournamentId']))
      .from(Invite)
      .where(
        and(
          eq(Invite.id, inviteId),
          eq(Invite.toUserId, session.userId),
          eq(Invite.status, 'pending'),
          isNotNull(Invite.tournamentId)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!invite) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invite not found'
      });
    }

    if (!invite.tournamentId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invite does not contain tournament ID'
      });
    }

    const { tournamentId } = invite;

    const staffMember = await getStaffMember('trpc', session, tournamentId, true);

    const staffRoleIds = await db
      .select(pick(InviteWithRole, ['staffRoleId']))
      .from(InviteWithRole)
      .where(eq(InviteWithRole.inviteId, inviteId))
      .then((rows) => rows.map((row) => row.staffRoleId));

    const staffMemberRoles = staffRoleIds.map<typeof StaffMemberRole.$inferInsert>(
      (staffRoleId) => {
        return {
          staffRoleId,
          staffMemberId: staffMember.id
        };
      }
    );

    await db.transaction(async (tx) => {
      await tx
        .insert(StaffMember)
        .values({
          userId: session.userId,
          tournamentId
        })
        .onConflictDoUpdate({
          set: {
            deletedAt: null,
            joinedStaffAt: sql`now()`
          },
          target: [StaffMember.userId, StaffMember.tournamentId],
          targetWhere: and(isNotNull(StaffMember.deletedAt), past(StaffMember.deletedAt))
        });

      await tx.insert(StaffMemberRole).values(staffMemberRoles);

      await tx
        .update(Invite)
        .set({
          status: 'accepted'
        })
        .where(eq(Invite.id, inviteId));
    });
  });

export const staffMembersRouter = trpc.router({
  searchUsers,
  sendJoinStaffInvite,
  sendDebuggerInvite,
  acceptJoinStaffInvite
});
