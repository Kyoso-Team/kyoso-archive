import * as v from 'valibot';
import env from '../env';
import {
  Ban,
  Country,
  db,
  DiscordUser,
  OsuBadge,
  OsuUser,
  OsuUserAwardedBadge,
  Session,
  User
} from '$db';
import { type SQL } from 'drizzle-orm';
import { and, desc, eq, isNull, not, or, sql } from 'drizzle-orm';
import { t } from '$trpc';
import { future, pick, trpcUnknownError } from '$lib/server/utils';
import { customAlphabet } from 'nanoid';
import { wrap } from '@typeschema/valibot';
import { positiveIntSchema, userSettingsSchema } from '$lib/schemas';
import { getSession } from '../helpers/api';
import { TRPCError } from '@trpc/server';
import { alias, unionAll } from 'drizzle-orm/pg-core';
import { rateLimitMiddleware } from '$trpc/middleware';
import { TRPCChecks } from '../helpers/checks';

const getUser = t.procedure
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

const searchUser = t.procedure
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

const resetApiKey = t.procedure.use(rateLimitMiddleware).mutation(async ({ ctx }) => {
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

const updateSelf = t
  .procedure
  .use(rateLimitMiddleware)
  .input(wrap(v.partial(v.object({
    settings: userSettingsSchema
  }))))
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

const updateUser = t.procedure
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

const banUser = t.procedure
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

    const liftAt = banTime ? new Date(new Date().getTime() + banTime) : undefined;

    try {
      await db.transaction(async (tx) => {
        await tx.insert(Ban).values({
          banReason,
          issuedToUserId,
          liftAt,
          issuedByUserId: session.userId
        });

        await tx
          .update(User)
          .set({
            admin: false,
            approvedHost: false
          })
          .where(eq(User.id, issuedToUserId));

        await tx
          .update(Session)
          .set({
            expired: true
          })
          .where(and(eq(Session.userId, issuedToUserId), not(Session.expired)));
      });
    } catch (err) {
      throw trpcUnknownError(err, 'Banning the user');
    }
  });

const revokeBan = t.procedure
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

const expireSession = t.procedure
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

export const usersRouter = t.router({
  getUser,
  searchUser,
  updateSelf,
  resetApiKey,
  updateUser,
  banUser,
  revokeBan,
  expireSession
});
