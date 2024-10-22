import { error } from '@sveltejs/kit';
import { and, desc, eq, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { Ban, Country, DiscordUser, OsuBadge, OsuUser, OsuUserAwardedBadge, User } from '$db';
import { env } from '$lib/server/env';
import { catcher } from '$lib/server/error';
import { getUserPlayerHistory, getUserStaffHistory } from '$lib/server/queries';
import { db } from '$lib/server/services';
import { future } from '$lib/server/sql';
import { pick } from '$lib/server/utils';
import { paginate } from '$lib/utils';
import type { PageServerLoad } from './$types';

async function getFullUser(userId: number) {
  return await db
    .select({
      ...pick(User, ['registeredAt', 'admin', 'approvedHost', 'settings', 'updatedApiDataAt']),
      osu: pick(OsuUser, [
        'osuUserId',
        'username',
        'globalStdRank',
        'globalTaikoRank',
        'globalCatchRank',
        'globalManiaRank',
        'restricted'
      ]),
      discord: pick(DiscordUser, ['discordUserId', 'username']),
      country: pick(Country, ['code', 'name'])
    })
    .from(User)
    .innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId))
    .innerJoin(DiscordUser, eq(DiscordUser.discordUserId, User.discordUserId))
    .innerJoin(Country, eq(Country.code, OsuUser.countryCode))
    .where(eq(User.id, userId))
    .limit(1)
    .then((users) => users[0]);
}

async function getUser(userId: number) {
  return await db
    .select({
      ...pick(User, ['registeredAt', 'admin', 'approvedHost', 'settings']),
      osu: pick(OsuUser, [
        'osuUserId',
        'username',
        'globalStdRank',
        'globalTaikoRank',
        'globalCatchRank',
        'globalManiaRank',
        'restricted'
      ]),
      discord: pick(DiscordUser, ['discordUserId', 'username']),
      country: pick(Country, ['code', 'name'])
    })
    .from(User)
    .leftJoin(
      DiscordUser,
      and(
        eq(DiscordUser.discordUserId, User.discordUserId),
        eq(sql`${User.settings} -> 'publicDiscord'`, true)
      )
    )
    .innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId))
    .innerJoin(Country, eq(Country.code, OsuUser.countryCode))
    .where(eq(User.id, userId))
    .limit(1)
    .then((users) => ({
      ...users[0],
      updatedApiDataAt: undefined
    }));
}

async function getBansFull(userId: number) {
  const IssuedBy = alias(User, 'issued_by');
  const IssuedByOsu = alias(OsuUser, 'issued_by_osu');
  const RevokedBy = alias(User, 'revoked_by');
  const RevokedByOsu = alias(OsuUser, 'revoked_by_osu');

  return await db
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
    .where(eq(Ban.issuedToUserId, userId))
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
}

async function getBans(userId: number) {
  return await db
    .select(pick(Ban, ['id', 'banReason', 'issuedAt', 'liftAt', 'revokeReason', 'revokedAt']))
    .from(Ban)
    .where(
      and(
        eq(Ban.issuedToUserId, userId),
        or(
          and(isNull(Ban.liftAt), isNull(Ban.revokedAt)),
          and(isNotNull(Ban.liftAt), future(Ban.liftAt), isNull(Ban.revokedAt))
        )
      )
    )
    .limit(1);
}

export const load = (async ({ params, parent, depends }) => {
  depends('reload:user');
  const { session, isUserOwner: isSessionUserOwner } = await parent();
  const viewAsAdmin = !!session?.admin;
  const userId = Number(params.user_id);
  const isCurrent = userId === session?.userId;

  const user = await (viewAsAdmin || isCurrent ? getFullUser(userId) : getUser(userId)).catch(
    catcher('page', 'Getting the user')
  );

  if (!user) {
    error(404, 'User not found');
  }

  const bans = await (viewAsAdmin ? getBansFull(userId) : getBans(userId)).catch(
    catcher('page', "Getting the user's bans")
  );

  const activeBan = bans.find(({ liftAt, revokedAt }) => {
    return (
      (!liftAt && !revokedAt) || (liftAt && liftAt.getTime() > new Date().getTime() && !revokedAt)
    );
  });
  const pastBans = bans.filter((ban) => ban.id !== activeBan?.id);

  if (activeBan && !viewAsAdmin) {
    error(403, 'User is currently banned');
  }

  const badges = await db
    .select({
      ...pick(OsuUserAwardedBadge, ['awardedAt']),
      ...pick(OsuBadge, ['imgFileName', 'description'])
    })
    .from(OsuUserAwardedBadge)
    .innerJoin(OsuBadge, eq(OsuBadge.id, OsuUserAwardedBadge.osuBadgeId))
    .where(eq(OsuUserAwardedBadge.osuUserId, user.osu.osuUserId))
    .orderBy(desc(OsuUserAwardedBadge.awardedAt))
    .catch(catcher('page', "Getting the user's badges"));

  const owner = user.osu.osuUserId === env.OWNER;
  const tournamentsStaffed = await getUserStaffHistory(userId, paginate(1, 10));
  const tournamentsPlayed = await getUserPlayerHistory(userId, paginate(1, 10));

  return {
    session,
    isSessionUserOwner,
    user: {
      ...user,
      viewAsAdmin,
      isCurrent,
      badges,
      pastBans,
      owner,
      activeBan,
      id: userId
    },
    tournaments: {
      staffed: tournamentsStaffed,
      played: tournamentsPlayed
    }
  };
}) satisfies PageServerLoad;
