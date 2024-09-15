import * as v from 'valibot';
import { env } from '$lib/server/env';
import { db, trpc } from '$lib/server/services';
import {
  Ban,
  Country,
  DiscordUser,
  Invite,
  InviteWithRole,
  OsuBadge,
  OsuUser,
  OsuUserAwardedBadge,
  Player,
  Session,
  StaffMember,
  StaffMemberRole,
  StaffRole,
  Team,
  Tournament,
  TournamentDates,
  User
} from '$db';
import { count, inArray, lt } from 'drizzle-orm';
import { and, desc, eq, isNull, not, or, sql } from 'drizzle-orm';
import { future, pick, trpcUnknownError } from '$lib/server/utils';
import { customAlphabet } from 'nanoid';
import { wrap } from '@typeschema/valibot';
import { positiveIntSchema, userSettingsSchema } from '$lib/schemas';
import { getSession } from '../../lib/server/helpers/api';
import { TRPCError } from '@trpc/server';
import { alias, unionAll } from 'drizzle-orm/pg-core';
import { rateLimitMiddleware } from '$trpc/middleware';
import { TRPCChecks } from '../../lib/server/helpers/checks';
import type { SQL } from 'drizzle-orm';

const getUser = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        userId: positiveIntSchema
      })
    )
  )
  .query(async ({ ctx, input }) => {
    const { userId } = input;
    const checks = new TRPCChecks({ action: 'get this user' });
    const session = getSession(ctx.cookies, true);
    checks.userIsAdmin(session);

    let user!: Pick<
      typeof User.$inferSelect,
      'id' | 'registeredAt' | 'updatedApiDataAt' | 'admin' | 'approvedHost'
    > & {
      osu: Pick<
        typeof OsuUser.$inferSelect,
        'osuUserId' | 'globalStdRank' | 'restricted' | 'username'
      >;
      discord: Pick<typeof DiscordUser.$inferSelect, 'discordUserId' | 'username'>;
      country: Pick<typeof Country.$inferSelect, 'code' | 'name'>;
    };

    try {
      user = await db
        .select({
          ...pick(User, ['id', 'registeredAt', 'updatedApiDataAt', 'admin', 'approvedHost']),
          osu: pick(OsuUser, ['osuUserId', 'globalStdRank', 'restricted', 'username']),
          discord: pick(DiscordUser, ['discordUserId', 'username']),
          country: pick(Country, ['code', 'name'])
        })
        .from(User)
        .innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId))
        .innerJoin(DiscordUser, eq(DiscordUser.discordUserId, User.discordUserId))
        .innerJoin(Country, eq(Country.code, OsuUser.countryCode))
        .where(eq(User.id, userId))
        .limit(1)
        .then((rows) => rows[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting the user');
    }

    let badges: (Pick<typeof OsuUserAwardedBadge.$inferSelect, 'awardedAt'> &
      Pick<typeof OsuBadge.$inferSelect, 'imgFileName' | 'description'>)[] = [];

    try {
      badges = await db
        .select({
          ...pick(OsuUserAwardedBadge, ['awardedAt']),
          ...pick(OsuBadge, ['imgFileName', 'description'])
        })
        .from(OsuUserAwardedBadge)
        .innerJoin(OsuBadge, eq(OsuBadge.id, OsuUserAwardedBadge.osuBadgeId))
        .where(eq(OsuUserAwardedBadge.osuUserId, user.osu.osuUserId))
        .orderBy(desc(OsuUserAwardedBadge.awardedAt));
    } catch (err) {
      throw trpcUnknownError(err, "Getting the user's badges");
    }

    let bans: (Pick<
      typeof Ban.$inferSelect,
      'id' | 'banReason' | 'issuedAt' | 'liftAt' | 'revokeReason' | 'revokedAt'
    > & {
      issuedBy: Pick<typeof User.$inferSelect, 'id'> &
        Pick<typeof OsuUser.$inferSelect, 'username'>;
      revokedBy:
        | (Pick<typeof User.$inferSelect, 'id'> & Pick<typeof OsuUser.$inferSelect, 'username'>)
        | null;
    })[] = [];

    const IssuedBy = alias(User, 'issued_by');
    const IssuedByOsu = alias(OsuUser, 'issued_by_osu');
    const RevokedBy = alias(User, 'revoked_by');
    const RevokedByOsu = alias(OsuUser, 'revoked_by_osu');

    try {
      bans = await db
        .select({
          ...pick(Ban, ['id', 'banReason', 'issuedAt', 'liftAt', 'revokeReason', 'revokedAt']),
          issuedBy: {
            ...pick(IssuedBy, ['id']),
            ...pick(IssuedByOsu, ['username'])
          },
          revokedBy: {
            ...pick(RevokedBy, ['id']),
            ...pick(RevokedByOsu, ['username'])
          }
        })
        .from(Ban)
        .innerJoin(IssuedBy, eq(IssuedBy.id, Ban.issuedByUserId))
        .innerJoin(IssuedByOsu, eq(IssuedByOsu.osuUserId, IssuedBy.osuUserId))
        .leftJoin(RevokedBy, eq(RevokedBy.id, Ban.revokedByUserId))
        .leftJoin(RevokedByOsu, eq(RevokedByOsu.osuUserId, RevokedBy.osuUserId))
        .where(eq(Ban.issuedToUserId, user.id))
        .orderBy(desc(Ban.issuedAt))
        .then((bans) => {
          return bans.map((ban) => ({
            ...ban,
            revokedBy:
              ban.revokedBy.id === null || ban.revokedBy.username === null
                ? null
                : {
                    id: ban.revokedBy.id,
                    username: ban.revokedBy.username
                  }
          }));
        });
    } catch (err) {
      throw trpcUnknownError(err, "Getting the user's bans");
    }

    const getActiveSessionsQuery = db
      .select(pick(Session, ['id', 'createdAt', 'lastActiveAt', 'expired']))
      .from(Session)
      .where(and(eq(Session.userId, user.id), not(Session.expired)))
      .orderBy(desc(Session.lastActiveAt));

    const getExpiredSessionsQuery = db
      .select(pick(Session, ['id', 'createdAt', 'lastActiveAt', 'expired']))
      .from(Session)
      .where(and(eq(Session.userId, user.id), eq(Session.expired, true)))
      .orderBy(desc(Session.lastActiveAt))
      .limit(30);

    let allSessions!: Pick<
      typeof Session.$inferSelect,
      'id' | 'createdAt' | 'lastActiveAt' | 'expired'
    >[];

    try {
      allSessions = await unionAll(getActiveSessionsQuery, getExpiredSessionsQuery);
    } catch (err) {
      throw trpcUnknownError(err, "Getting the user's sessions");
    }

    const sessions = {
      active: allSessions.filter(({ expired }) => !expired),
      expired: allSessions.filter(({ expired }) => expired)
    };

    return {
      ...user,
      badges,
      bans,
      sessions,
      owner: user.osu.osuUserId === env.OWNER
    };
  });

const searchUser = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        search: v.string([v.minLength(1)]),
        searchBy: v.string([v.minLength(1)])
      })
    )
  )
  .query(async ({ ctx, input }) => {
    const { search, searchBy } = input;
    const checks = new TRPCChecks({ action: 'search this user' });
    const session = getSession(ctx.cookies, true);
    checks.userIsAdmin(session);

    const searchNum = isNaN(Number(search)) ? 0 : Number(search);
    let where!: SQL;

    if (searchBy === 'osu') {
      where = eq(User.osuUserId, searchNum);
    } else if (searchBy === 'discord') {
      where = eq(User.discordUserId, search);
    } else if (searchBy === 'kyoso') {
      where = eq(User.id, searchNum);
    } else {
      where = eq(OsuUser.username, search);
    }

    let user: Pick<typeof User.$inferSelect, 'id'> | undefined;

    try {
      user = await db
        .select(pick(User, ['id']))
        .from(User)
        .innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId))
        .where(where)
        .limit(1)
        .then((users) => users[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Searching the user');
    }

    return user;
  });

const resetApiKey = trpc.procedure.use(rateLimitMiddleware).mutation(async ({ ctx }) => {
  const session = getSession(ctx.cookies, true);

  try {
    await db
      .update(User)
      .set({
        apiKey: customAlphabet(
          '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
          24
        )()
      })
      .where(eq(User.id, session.userId));
  } catch (err) {
    throw trpcUnknownError(err, 'Updating the user');
  }
});

const updateSelf = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.partial(
        v.object({
          settings: userSettingsSchema
        })
      )
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { settings } = input;
    const session = getSession(ctx.cookies, true);

    try {
      await db
        .update(User)
        .set({
          settings
        })
        .where(eq(User.id, session.userId));
    } catch (err) {
      throw trpcUnknownError(err, 'Updating the user');
    }
  });

const makeAdmin = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        userId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { userId } = input;
    const checks = new TRPCChecks({ action: 'make this user an admin' });
    const session = getSession(ctx.cookies, true);
    checks.userIsOwner(session);

    let user: Pick<typeof User.$inferSelect, 'admin'> | undefined;

    try {
      user = await db
        .select(pick(User, ['admin']))
        .from(User)
        .where(eq(User.id, userId))
        .limit(1)
        .then((users) => users[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting the user');
    }

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    if (user.admin) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is already an admin'
      });
    }

    try {
      await db.transaction(async (tx) => {
        await tx
          .update(User)
          .set({
            admin: true
          })
          .where(eq(User.id, userId));

        await tx
          .update(Session)
          .set({
            updateCookie: true
          })
          .where(and(eq(Session.userId, userId), not(Session.expired)));
      });
    } catch (err) {
      throw trpcUnknownError(err, 'Updating the user');
    }
  });

const removeAdmin = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        userId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { userId } = input;
    const checks = new TRPCChecks({ action: "remove this user's admin status" });
    const session = getSession(ctx.cookies, true);
    checks.userIsOwner(session);

    let user: Pick<typeof User.$inferSelect, 'admin'> | undefined;

    try {
      user = await db
        .select(pick(User, ['admin']))
        .from(User)
        .where(eq(User.id, userId))
        .limit(1)
        .then((users) => users[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting the user');
    }

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    if (!user.admin) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is already not an admin'
      });
    }

    const asDebuggerSq = db.$with('as_debugger').as(
      db
        .select(pick(StaffMemberRole, ['staffMemberId']))
        .from(StaffMemberRole)
        .innerJoin(StaffRole, eq(StaffRole.id, StaffMemberRole.staffRoleId))
        .innerJoin(StaffMember, eq(StaffMember.id, StaffMemberRole.staffMemberId))
        .where(and(eq(StaffRole.order, 1), eq(StaffMember.userId, userId)))
    );

    const inviteAsDebuggerSq = db.$with('invite_as_debugger').as(
      db
        .select(pick(InviteWithRole, ['inviteId']))
        .from(InviteWithRole)
        .innerJoin(StaffRole, eq(StaffRole.id, InviteWithRole.staffRoleId))
        .innerJoin(Invite, eq(Invite.id, InviteWithRole.inviteId))
        .where(
          and(eq(StaffRole.order, 1), eq(Invite.status, 'pending'), eq(Invite.toUserId, userId))
        )
    );

    try {
      await db.transaction(async (tx) => {
        await tx
          .update(User)
          .set({
            admin: false
          })
          .where(eq(User.id, userId));

        await tx
          .update(Session)
          .set({
            updateCookie: true
          })
          .where(and(eq(Session.userId, userId), not(Session.expired)));

        // Remove admin from any tournament where they're a debugger, since a debugger must be an admin
        await tx
          .with(asDebuggerSq)
          .delete(StaffMemberRole)
          .where(inArray(StaffMemberRole.staffMemberId, db.select().from(asDebuggerSq)));

        await tx
          .update(StaffMember)
          .set({
            deletedAt: sql`now()`
          })
          .where(eq(StaffMember.userId, userId));

        // Cancel pending invitations to become a debugger in a tournament
        await tx
          .with(inviteAsDebuggerSq)
          .update(Invite)
          .set({
            status: 'cancelled'
          })
          .where(inArray(Invite.id, db.select().from(inviteAsDebuggerSq)));
      });
    } catch (err) {
      throw trpcUnknownError(err, 'Updating the user');
    }
  });

const makeApprovedHost = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        userId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { userId } = input;
    const checks = new TRPCChecks({ action: 'make this user an approved host' });
    const session = getSession(ctx.cookies, true);
    checks.userIsAdmin(session);

    let user: Pick<typeof User.$inferSelect, 'approvedHost' | 'osuUserId'> | undefined;

    try {
      user = await db
        .select(pick(User, ['approvedHost', 'osuUserId']))
        .from(User)
        .where(eq(User.id, userId))
        .limit(1)
        .then((users) => users[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting the user');
    }

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    if (user.osuUserId === env.OWNER) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: "You can't update the owner's approved host status"
      });
    }

    if (user.approvedHost) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is already an approved host'
      });
    }

    try {
      await db.transaction(async (tx) => {
        await tx
          .update(User)
          .set({
            approvedHost: true
          })
          .where(eq(User.id, userId));

        await tx
          .update(Session)
          .set({
            updateCookie: true
          })
          .where(and(eq(Session.userId, userId), not(Session.expired)));
      });
    } catch (err) {
      throw trpcUnknownError(err, 'Updating the user');
    }
  });

const removeApprovedHost = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        userId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { userId } = input;
    const checks = new TRPCChecks({ action: "remove this user's approved host status" });
    const session = getSession(ctx.cookies, true);
    checks.userIsAdmin(session);

    let user: Pick<typeof User.$inferSelect, 'approvedHost' | 'osuUserId'> | undefined;

    try {
      user = await db
        .select(pick(User, ['approvedHost', 'osuUserId']))
        .from(User)
        .where(eq(User.id, userId))
        .limit(1)
        .then((users) => users[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting the user');
    }

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    if (user.osuUserId === env.OWNER) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: "You can't update the owner's approved host status"
      });
    }

    if (!user.approvedHost) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is already not an approved host'
      });
    }

    try {
      await db.transaction(async (tx) => {
        await tx
          .update(User)
          .set({
            approvedHost: false
          })
          .where(eq(User.id, userId));

        await tx
          .update(Session)
          .set({
            updateCookie: true
          })
          .where(and(eq(Session.userId, userId), not(Session.expired)));

        // Cancel pending invitations to become a tournament's host
        await tx
          .update(Invite)
          .set({
            status: 'cancelled'
          })
          .where(
            and(
              eq(Invite.status, 'pending'),
              eq(Invite.reason, 'delegate_host'),
              eq(Invite.toUserId, userId)
            )
          );
      });
    } catch (err) {
      throw trpcUnknownError(err, 'Updating the user');
    }
  });

const updateUser = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        userId: positiveIntSchema,
        data: v.partial(
          v.object({
            admin: v.boolean(),
            approvedHost: v.boolean()
          })
        )
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { data, userId } = input;
    const { admin, approvedHost } = data;
    const checks = new TRPCChecks({ action: 'update this user' });
    const session = getSession(ctx.cookies, true);
    checks.userIsAdmin(session).partialHasValues(data);

    if (admin !== undefined && session.osu.id !== env.OWNER) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have the required permissions to remove or add this user as an admin'
      });
    }

    try {
      await db.transaction(async (tx) => {
        await tx
          .update(User)
          .set({
            admin,
            approvedHost
          })
          .where(eq(User.id, userId));

        await tx
          .update(Session)
          .set({
            updateCookie: true
          })
          .where(and(eq(Session.userId, userId), not(Session.expired)));
      });
    } catch (err) {
      throw trpcUnknownError(err, 'Updating the user');
    }
  });

const banUser = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        banReason: v.string([v.minLength(1)]),
        issuedToUserId: positiveIntSchema,
        /** In milliseconds. If undefined, the ban is permanent */
        banTime: v.optional(positiveIntSchema)
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { banReason, banTime, issuedToUserId } = input;
    const checks = new TRPCChecks({ action: 'ban this user' });
    const session = getSession(ctx.cookies, true);
    checks.userIsAdmin(session);

    let hasActiveBan!: boolean;

    try {
      hasActiveBan = await db
        .execute(
          sql`
              select exists (select 1
                             from ${Ban}
                             where ${and(
                               eq(Ban.issuedToUserId, issuedToUserId),
                               and(
                                 isNull(Ban.revokedAt),
                                 or(isNull(Ban.liftAt), future(Ban.liftAt))
                               )
                             )}
                             limit 1)
          `
        )
        .then((bans) => !!bans[0]?.exists);
    } catch (err) {
      throw trpcUnknownError(err, "Verifying the user's ban status");
    }

    if (hasActiveBan) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'User is already banned'
      });
    }

    let user: Pick<typeof User.$inferSelect, 'admin' | 'osuUserId'> | undefined;

    try {
      user = await db
        .select(pick(User, ['admin', 'osuUserId']))
        .from(User)
        .where(eq(User.id, issuedToUserId))
        .limit(1)
        .then((users) => users[0]);
    } catch (err) {
      throw trpcUnknownError(err, 'Getting the user');
    }

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    if (user.osuUserId === env.OWNER) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: "You can't ban the owner"
      });
    }

    if (user.admin && session.osu.id !== env.OWNER) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Only the owner can ban other admins'
      });
    }

    const tournamentCurrentlyHostedByBannedUserSq = db
      .$with('tournament_currently_hosted_by_banned_user')
      .as(
        db
          .select({
            ...pick(Tournament, ['id']),
            staffMemberCount: count(StaffMember.id).as('staff_member_count')
          })
          .from(Tournament)
          .innerJoin(TournamentDates, eq(TournamentDates.tournamentId, Tournament.id))
          .innerJoin(StaffMember, eq(StaffMember.tournamentId, Tournament.id))
          .innerJoin(StaffMemberRole, eq(StaffMemberRole.staffMemberId, StaffMember.id))
          .innerJoin(StaffRole, eq(StaffRole.id, StaffMemberRole.staffRoleId))
          .where(
            and(
              eq(StaffRole.order, 2),
              eq(StaffMember.userId, issuedToUserId),
              or(isNull(StaffMember.deletedAt), future(StaffMember.deletedAt)),
              or(isNull(TournamentDates.concludesAt), future(TournamentDates.concludesAt)),
              or(isNull(Tournament.deletedAt), future(Tournament.deletedAt))
            )
          )
          .groupBy(Tournament.id)
      );

    const teamWhereBannedUserIsCaptainSq = db.$with('team_where_banned_user_is_captain').as(
      db
        .select({
          ...pick(Team, ['id']),
          playerCount: count(Player.id).as('player_count')
        })
        .from(Team)
        .innerJoin(Tournament, eq(Tournament.id, Team.tournamentId))
        .innerJoin(TournamentDates, eq(TournamentDates.tournamentId, Tournament.id))
        .innerJoin(Player, eq(Player.teamId, Team.id))
        .where(
          and(
            eq(Player.userId, issuedToUserId),
            eq(Team.captainPlayerId, Player.id),
            or(isNull(Team.deletedAt), future(Team.deletedAt)),
            or(isNull(Player.deletedAt), future(Player.deletedAt)),
            or(isNull(TournamentDates.concludesAt), future(TournamentDates.concludesAt)),
            or(isNull(Tournament.deletedAt), future(Tournament.deletedAt))
          )
        )
        .groupBy(Team.id)
    );

    try {
      await db.transaction(async (tx) => {
        await tx.insert(Ban).values({
          banReason,
          issuedToUserId,
          liftAt: banTime ? new Date(new Date().getTime() + banTime) : undefined,
          issuedByUserId: session.userId
        });

        await tx
          .update(User)
          .set({
            admin: false,
            approvedHost: false,
            apiKey: null
          })
          .where(eq(User.id, issuedToUserId));

        await tx
          .update(Session)
          .set({
            expired: true
          })
          .where(and(eq(Session.userId, issuedToUserId), not(Session.expired)));

        // Remove the banned user from any tournaments they're staffing
        const asStaffMember = await tx
          .update(StaffMember)
          .set({
            deletedAt: sql`now()`
          })
          .where(eq(StaffMember.userId, issuedToUserId))
          .returning(pick(StaffMember, ['id']))
          .then((staffMembers) => staffMembers.map((staffMember) => staffMember.id));

        if (asStaffMember.length > 0) {
          await tx
            .delete(StaffMemberRole)
            .where(inArray(StaffMemberRole.staffMemberId, asStaffMember));
        }

        // TOD: If the banned user was a host for a tournament, automatically delegate host to a random staff member with the highest staff role
        // await tx.execute(
        //   sql`
        //     with ${tournamentCurrentlyHostedByBannedUserSq}
        //     insert into ${StaffMemberRole} (${StaffMemberRole.staffMemberId}, ${StaffMemberRole.staffRoleId})
        //     select distinct on (${Tournament.id}) ${StaffMemberRole.staffMemberId}, ${StaffMemberRole.staffRoleId}
        //     from ${StaffMemberRole}
        //     inner join ${StaffMember} on ${StaffMember.id} = ${StaffMemberRole.staffMemberId}
        //     inner join ${StaffRole} on ${StaffRole.id} = ${StaffMemberRole.staffRoleId}
        //     inner join ${Tournament} on ${Tournament.id} = ${StaffMember.tournamentId}
        //     inner join ${TournamentDates} on ${TournamentDates.tournamentId} = ${Tournament.id}
        //     where ${
        //       and(
        //         gt(StaffRole.order, 5),
        //         inArray(
        //           StaffMember.tournamentId,
        //           db
        //             .select({ id: tournamentCurrentlyHostedByBannedUserSq.id })
        //             .from(tournamentCurrentlyHostedByBannedUserSq)
        //             .where(gt(tournamentCurrentlyHostedByBannedUserSq.staffMemberCount, 1))
        //         )
        //       )
        //     }
        //     order by ${StaffRole.order} asc, ${StaffMember.joinedStaffAt} desc
        //   `
        // );

        // If the hosted tournament doesn't have any other staff members, then delete
        await tx
          .with(tournamentCurrentlyHostedByBannedUserSq)
          .update(Tournament)
          .set({
            deletedAt: sql`now()`
          })
          .where(
            inArray(
              Tournament.id,
              db
                .select({ id: tournamentCurrentlyHostedByBannedUserSq.id })
                .from(tournamentCurrentlyHostedByBannedUserSq)
                .where(lt(tournamentCurrentlyHostedByBannedUserSq.staffMemberCount, 2))
            )
          );

        // Remove the banned user from any tournaments they're playing
        await tx
          .update(Player)
          .set({
            deletedAt: sql`now()`
          })
          .where(eq(Player.userId, issuedToUserId));

        // TODO: If the banned user was a captain for a team, delegate captaincy to a random player
        // await tx.execute(
        //   sql`
        //     update ${Team}
        //     set ${Team.captainPlayerId} = (select ${Player.id} from ${Player} where ${Player.teamId} = ${Team.id} order by random() limit 1)
        //     where ${
        //       and(
        //         or(isNull(Team.deletedAt), future(Team.deletedAt)),
        //         or(isNull(Player.deletedAt), future(Player.deletedAt)),
        //         inArray(
        //           Team.id,
        //           db
        //             .select({ id: teamWhereBannedUserIsCaptainSq.id })
        //             .from(teamWhereBannedUserIsCaptainSq)
        //             .where(gt(teamWhereBannedUserIsCaptainSq.playerCount, 1))
        //         )
        //       )
        //     }
        //   `
        // );

        // If the team doesn't have any other players, then delete
        await tx
          .with(teamWhereBannedUserIsCaptainSq)
          .update(Team)
          .set({
            deletedAt: sql`now()`
          })
          .where(
            inArray(
              Team.id,
              db
                .select({ id: teamWhereBannedUserIsCaptainSq.id })
                .from(teamWhereBannedUserIsCaptainSq)
                .where(lt(teamWhereBannedUserIsCaptainSq.playerCount, 2))
            )
          );

        // Cancel any invitations for and from the banned user
        await tx
          .update(Invite)
          .set({
            status: 'cancelled'
          })
          .where(
            and(
              eq(Invite.status, 'pending'),
              or(eq(Invite.byUserId, issuedToUserId), eq(Invite.toUserId, issuedToUserId))
            )
          );
      });
    } catch (err) {
      throw trpcUnknownError(err, 'Banning the user');
    }
  });

const revokeBan = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        banId: positiveIntSchema,
        revokeReason: v.string([v.minLength(1)])
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    const { banId, revokeReason } = input;
    const checks = new TRPCChecks({ action: 'revoke this ban' });
    const session = getSession(ctx.cookies, true);
    checks.userIsAdmin(session);

    try {
      await db
        .update(Ban)
        .set({
          revokeReason,
          revokedAt: sql`now()`,
          revokedByUserId: session.userId
        })
        .where(eq(Ban.id, banId));
    } catch (err) {
      throw trpcUnknownError(err, 'Revoking the ban');
    }
  });

const expireSession = trpc.procedure
  .use(rateLimitMiddleware)
  .input(
    wrap(
      v.object({
        sessionId: positiveIntSchema
      })
    )
  )
  .mutation(async ({ ctx, input }) => {
    getSession(ctx.cookies, true);

    try {
      await db
        .update(Session)
        .set({
          expired: true
        })
        .where(eq(Session.id, input.sessionId));
    } catch (err) {
      throw trpcUnknownError(err, 'Expiring the session');
    }
  });

export const usersRouter = trpc.router({
  getUser,
  searchUser,
  updateSelf,
  resetApiKey,
  updateUser,
  makeAdmin,
  removeAdmin,
  makeApprovedHost,
  removeApprovedHost,
  banUser,
  revokeBan,
  expireSession
});
