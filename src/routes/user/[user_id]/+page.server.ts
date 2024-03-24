import env from '$lib/server/env';
import { Ban, Country, DiscordUser, OsuBadge, OsuUser, OsuUserAwardedBadge, User, db } from '$db';
import { apiError, pick } from '$lib/server/utils';
import { desc, eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, route }) => {
  const userId = isNaN(Number(params.user_id)) ? 0 : Number(params.user_id);
  let user: (Pick<typeof User.$inferSelect, 'id' | 'registeredAt' | 'admin' | 'approvedHost'> & {
    osu: Pick<typeof OsuUser.$inferSelect, 'osuUserId' | 'username' | 'globalStdRank' | 'restricted'>;
    country: Pick<typeof Country.$inferSelect, 'code' | 'name'>;
    discord: Pick<typeof DiscordUser.$inferSelect, 'discordUserId' | 'username'>;
  }) | undefined;

  try {
    user = await db
      .select({
        ...pick(User, ['id', 'registeredAt', 'admin', 'approvedHost']),
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
  } catch (err) {
    throw await apiError(err, 'Getting the user', route);
  }

  if (!user) {
    error(404, 'User not found');
  }

  let bans: Pick<
    typeof Ban.$inferSelect,
    'id' | 'banReason' | 'issuedAt' | 'liftAt' | 'revokeReason' | 'revokedAt'
  >[] = [];

  try {
    bans = await db
      .select(pick(Ban, ['id', 'banReason', 'issuedAt', 'liftAt', 'revokeReason', 'revokedAt']))
      .from(Ban)
      .where(eq(Ban.issuedToUserId, user.id))
      .orderBy(desc(Ban.issuedAt));
  } catch (err) {
    throw await apiError(err, "Getting the user's bans", route);
  }

  const activeBan = bans.find(({ liftAt, revokedAt }) => {
    return (!liftAt && !revokedAt) || (liftAt && liftAt.getTime() > new Date().getTime() && !revokedAt);
  });
  const pastBans = bans.filter(({ id }) => id !== activeBan?.id);

  if (activeBan) {
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

  return {
    badges,
    pastBans,
    user: {
      ...user,
      owner: env.OWNER === user.osu.osuUserId
    }
  };
}) satisfies PageServerLoad;
