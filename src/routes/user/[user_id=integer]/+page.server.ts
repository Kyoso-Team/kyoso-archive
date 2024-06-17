import env from '$lib/server/env';
import { apiError, future, pick } from '$lib/server/utils';
import { and, desc, eq, isNotNull, isNull, or } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { alias } from 'drizzle-orm/pg-core';
import { Ban, Country, DiscordUser, OsuBadge, OsuUser, OsuUserAwardedBadge, User, db } from '$db';
import type { PageServerLoad } from './$types';

type UserT = Pick<
  typeof User.$inferSelect,
  'registeredAt' | 'admin' | 'approvedHost' | 'updatedApiDataAt'
> & {
  osu: Pick<typeof OsuUser.$inferSelect, 'osuUserId' | 'username' | 'globalStdRank' | 'restricted'>;
  country: Pick<typeof Country.$inferSelect, 'code' | 'name'>;
  discord: Pick<typeof DiscordUser.$inferSelect, 'discordUserId' | 'username'>;
};

type BanT = Pick<
  typeof Ban.$inferSelect,
  'id' | 'banReason' | 'issuedAt' | 'liftAt' | 'revokeReason' | 'revokedAt'
> & {
  issuedBy: Pick<typeof User.$inferSelect, 'id'> & Pick<typeof OsuUser.$inferSelect, 'username'>;
  revokedBy:
    | (Pick<typeof User.$inferSelect, 'id'> & Pick<typeof OsuUser.$inferSelect, 'username'>)
    | null;
};

export const load = (async ({ params, route, parent }) => {
  const { session } = await parent();
  const viewAsAdmin = !!session?.admin;
  const userId = Number(params.user_id);

  let user: Omit<UserT, 'updatedApiDataAt' | 'discord'> | undefined;

  try {
    if (viewAsAdmin) {
      const user_: UserT | undefined = await db
        .select({
          ...pick(User, ['registeredAt', 'admin', 'approvedHost', 'updatedApiDataAt']),
          osu: pick(OsuUser, ['osuUserId', 'username', 'globalStdRank', 'restricted']),
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

      user = user_;
    } else {
      const user_: Omit<UserT, 'updatedApiDataAt' | 'discord'> | undefined = await db
        .select({
          ...pick(User, ['registeredAt', 'admin', 'approvedHost']),
          osu: pick(OsuUser, ['osuUserId', 'username', 'globalStdRank', 'restricted']),
          country: pick(Country, ['code', 'name'])
        })
        .from(User)
        .innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId))
        .innerJoin(Country, eq(Country.code, OsuUser.countryCode))
        .where(eq(User.id, userId))
        .limit(1)
        .then((users) => users[0]);

      user = user_;
    }
  } catch (err) {
    throw await apiError(err, 'Getting the user', route);
  }

  if (!user) {
    error(404, 'User not found');
  }

  let bans: Omit<BanT, 'issuedBy' | 'revokedBy'>[] = [];
  const IssuedBy = alias(User, 'issued_by');
  const IssuedByOsu = alias(OsuUser, 'issued_by_osu');
  const RevokedBy = alias(User, 'revoked_by');
  const RevokedByOsu = alias(OsuUser, 'revoked_by_osu');

  try {
    if (viewAsAdmin) {
      const bans_: BanT[] = await db
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

      bans = bans_;
    } else {
      // Only gets the active ban (if any)
      const bans_: Omit<BanT, 'issuedBy' | 'revokedBy'>[] = await db
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

      bans = bans_;
    }
  } catch (err) {
    throw await apiError(err, "Getting the user's bans", route);
  }

  const activeBan = bans.find(({ liftAt, revokedAt }) => {
    return (
      (!liftAt && !revokedAt) || (liftAt && liftAt.getTime() > new Date().getTime() && !revokedAt)
    );
  });

  if (activeBan && !viewAsAdmin) {
    error(403, 'User is currently banned');
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
    throw await apiError(err, "Getting the user's badges", route);
  }

  const owner = user.osu.osuUserId === env.OWNER;

  return {
    session,
    user: {
      ...user,
      viewAsAdmin,
      badges,
      bans,
      owner,
      activeBan,
      id: userId
    } as
      | (UserT & {
          viewAsAdmin: true;
          badges: typeof badges;
          bans: BanT[];
          owner: boolean;
          activeBan?: BanT;
          id: number;
        })
      | (Omit<UserT, 'updatedApiDataAt' | 'discord'> & {
          viewAsAdmin: false;
          badges: typeof badges;
          bans: Omit<BanT, 'issuedBy' | 'revokedBy'>[];
          owner: boolean;
          activeBan?: BanT;
          id: number;
        })
  };
}) satisfies PageServerLoad;
