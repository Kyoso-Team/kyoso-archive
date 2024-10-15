import { eq, inArray } from 'drizzle-orm';
import { Client } from 'osu-web.js';
import { Country, DiscordUser, OsuBadge, OsuUser, OsuUserAwardedBadge, Session } from '$db';
import { env } from '$lib/server/env';
import { catcher } from '$lib/server/error';
import { db, discordMainAuth } from '$lib/server/services';
import { pick } from '$lib/server/utils';
import type DiscordOAuth2 from 'discord-oauth2';
import type { Token } from 'osu-web.js';
import type { ErrorInside } from '$lib/types';

export async function upsertDiscordUser(
  inside: ErrorInside,
  token: DiscordOAuth2.TokenRequestResult,
  tokenIssuedAt: Date,
  update?: {
    discordUserId: string;
  }
) {
  const user = await discordMainAuth
    .getUser(token.access_token)
    .catch(catcher(inside, "Getting the user's Discord data"));

  const set = {
    username: user.username,
    token: {
      accesstoken: token.access_token,
      refreshToken: token.refresh_token,
      tokenIssuedAt: tokenIssuedAt.getTime()
    }
  } satisfies Partial<typeof DiscordUser.$inferInsert>;

  if (update?.discordUserId) {
    await db
      .update(DiscordUser)
      .set(set)
      .where(eq(DiscordUser.discordUserId, update.discordUserId))
      .catch(catcher(inside, "Updating the user's Discord data"));
  } else {
    await db
      .insert(DiscordUser)
      .values({
        ...set,
        discordUserId: user.id
      })
      .onConflictDoUpdate({
        target: [DiscordUser.discordUserId],
        set
      })
      .catch(catcher(inside, "Upserting the user's Discord data"));
  }

  return user;
}

export async function upsertOsuUser(
  inside: ErrorInside,
  token: Token,
  tokenIssuedAt: Date,
  update?: {
    osuUserId: number;
  }
) {
  const osu = new Client(token.access_token);
  const user = await osu.users
    .getSelf({
      urlParams: {
        mode: 'osu'
      }
    })
    .catch(catcher(inside, "Getting the user's osu! data"));

  await db
    .insert(Country)
    .values({
      code: user.country.code,
      name: user.country.name
    })
    .onConflictDoNothing({
      target: [Country.code]
    })
    .catch(catcher(inside, "Creating the user's country"));

  const badges: (typeof OsuBadge.$inferInsert)[] = user.badges.map((badge) => ({
    description: badge.description,
    imgFileName: badge.image_url.match(/https:\/\/assets\.ppy\.sh\/profile-badges\/(.*)/)?.[1] || ''
  }));

  if (badges.length > 0) {
    await db
      .insert(OsuBadge)
      .values(badges)
      .onConflictDoNothing({
        target: [OsuBadge.imgFileName]
      })
      .catch(catcher(inside, "Creating the user's badges"));
  }

  const dbBadges =
    badges.length > 0
      ? await db
          .select(pick(OsuBadge, ['id', 'imgFileName']))
          .from(OsuBadge)
          .where(
            inArray(
              OsuBadge.imgFileName,
              badges.map(({ imgFileName }) => imgFileName)
            )
          )
          .catch(catcher(inside, "Getting the user's badges"))
      : [];

  const set = {
    countryCode: user.country.code,
    restricted: user.is_restricted,
    username: user.username,
    globalStdRank: user.statistics_rulesets.osu?.global_rank ?? null,
    globalTaikoRank: user.statistics_rulesets.taiko?.global_rank ?? null,
    globalCatchRank: user.statistics_rulesets.fruits?.global_rank ?? null,
    globalManiaRank: user.statistics_rulesets.mania?.global_rank ?? null,
    token: {
      accesstoken: token.access_token,
      refreshToken: token.refresh_token,
      tokenIssuedAt: tokenIssuedAt.getTime()
    }
  } satisfies Partial<typeof OsuUser.$inferInsert>;

  if (update?.osuUserId) {
    await db
      .update(OsuUser)
      .set(set)
      .where(eq(OsuUser.osuUserId, update.osuUserId))
      .catch(catcher(inside, "Updating the user's osu! data"));
  } else {
    await db
      .insert(OsuUser)
      .values({
        ...set,
        osuUserId: user.id
      })
      .onConflictDoUpdate({
        target: [OsuUser.osuUserId],
        set
      })
      .catch(catcher(inside, "Upserting the user's osu! data"));
  }

  // NOTE: If a badge has been removed from the user, this case isn't hadled due to the very high unlikelyhood of this happening

  const awardedBadges: (typeof OsuUserAwardedBadge.$inferInsert)[] = user.badges.map((badge) => ({
    awardedAt: new Date(badge.awarded_at),
    osuBadgeId: dbBadges.find(
      ({ imgFileName }) => (badge.image_url.split('/').at(-1) || '') === imgFileName
    )!.id,
    osuUserId: user?.id || 0
  }));

  if (awardedBadges.length > 0) {
    await db
      .insert(OsuUserAwardedBadge)
      .values(awardedBadges)
      .onConflictDoNothing({
        target: [OsuUserAwardedBadge.osuBadgeId, OsuUserAwardedBadge.osuUserId]
      })
      .catch(catcher(inside, 'Linking the user and their awarded badges'));
  }

  return user;
}

export async function createSession(
  inside: ErrorInside,
  userId: number,
  ipAddress: string,
  userAgent: string
) {
  let ipMeta!: { city: string; region: string; country: string };

  if (env.NODE_ENV === 'production') {
    ipMeta = await fetch(`https://ipinfo.io/${ipAddress}?token=${env.IPINFO_ACCESS_TOKEN}`)
      .then(
        async (resp) =>
          (await resp.json()) as {
            city: string;
            region: string;
            country: string;
          }
      )
      .catch(catcher(inside, "Getting the IP address' information"));
  } else {
    ipMeta = {
      city: 'City',
      region: 'Region',
      country: 'Country'
    };
  }

  const session = await db
    .insert(Session)
    .values({
      userId,
      userAgent,
      ipAddress: env.NODE_ENV === 'production' ? ipAddress : '127.0.0.1',
      ipMetadata: {
        city: ipMeta.city,
        region: ipMeta.region,
        country: ipMeta.country
      }
    })
    .returning(pick(Session, ['id']))
    .then((session) => session[0])
    .catch(catcher(inside, 'Creating the session'));

  return session;
}
