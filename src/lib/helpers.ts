import { Country, DiscordUser, OsuBadge, OsuUser, OsuUserAwardedBadge, db } from '$db';
import { discordAuth } from './constants';
import { sveltekitError } from './server-utils';
import { Client } from 'osu-web.js';
import { eq } from 'drizzle-orm';
import type DiscordOAuth2 from 'discord-oauth2';
import type { Token } from 'osu-web.js';

export async function upsertDiscordUser(token: DiscordOAuth2.TokenRequestResult, route: { id: string | null; }, update?: {
  discordUserId: string;
}) {
  let user!: Awaited<ReturnType<DiscordOAuth2['getUser']>>;

  try {
    user = await discordAuth.getUser(token.access_token);
  } catch (err) {
    throw await sveltekitError(err, 'Getting the user\'s Discord data', route);
  }

  const set = {
    accesstoken: token.access_token,
    refreshToken: token.refresh_token,
    username: user.username
  } satisfies Partial<typeof DiscordUser.$inferInsert>;
  
  try {
    if (update?.discordUserId) {
      await db
        .update(DiscordUser)
        .set(set)
        .where(eq(DiscordUser.discordUserId, update.discordUserId));
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
        });
    }
  } catch (err) {
    throw await sveltekitError(err, `${update ? 'Updating': 'Upserting'} the user's Discord data`, route);
  }

  return user;
}

export async function upsertOsuUser(token: Token, route: { id: string | null; }, update?: {
  osuUserId: number;
}) {
  const osu = new Client(token.access_token);
  let user!: Awaited<ReturnType<Client['users']['getSelf']>>;

  try {
    user = await osu.users.getSelf({
      urlParams: {
        mode: 'osu'
      }
    });
  } catch (err) {
    throw await sveltekitError(err, 'Getting the user\'s osu! data', route);
  }

  if (!user) {
    return undefined as any;
  }

  try {
    await db
      .insert(Country)
      .values({
        code: user.country.code,
        name: user.country.name
      })
      .onConflictDoNothing({
        target: [Country.code]
      });
  } catch (err) {
    throw await sveltekitError(err, 'Creating the user\'s country', route);
  }

  const badges: typeof OsuBadge.$inferInsert[] = user.badges.map((badge) => ({
    description: badge.description,
    imgFileName: badge.image_url.split('/').at(-1) || ''
  }));

  if (badges.length > 0) {
    try {
      await db
        .insert(OsuBadge)
        .values(badges)
        .onConflictDoNothing({
          target: [OsuBadge.imgFileName]
        });
    } catch (err) {
      throw await sveltekitError(err, 'Creating the user\'s badges', route);
    }
  }


  const set = {
    accessToken: token.access_token,
    countryCode: user.country.code,
    isRestricted: user.is_restricted,
    refreshToken: token.refresh_token,
    username: user.username,
    globalStdRank: user.statistics.global_rank
  } satisfies Partial<typeof OsuUser.$inferInsert>;

  try {
    if (update?.osuUserId) {
      await db
        .update(OsuUser)
        .set(set)
        .where(eq(OsuUser.osuUserId, update.osuUserId));
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
        });
    }
  } catch (err) {
    throw await sveltekitError(err, `${update ? 'Updating': 'Upserting'} the user's osu! data`, route);
  }

  // NOTE: If a badge has been removed from the user, this case isn't hadled due to the very high unlikelyhood of this happening

  const awardedBadges: typeof OsuUserAwardedBadge.$inferInsert[] = user.badges.map((badge) => ({
    awardedAt: new Date(badge.awarded_at),
    osuBadgeImgFileName: badge.image_url.split('/').at(-1) || '',
    osuUserId: user?.id || 0
  }));

  if (awardedBadges.length > 0) {
    try {
      await db
        .insert(OsuUserAwardedBadge)
        .values(awardedBadges)
        .onConflictDoNothing({
          target: [OsuUserAwardedBadge.osuBadgeImgFileName, OsuUserAwardedBadge.osuUserId]
        });
    } catch (err) {
      throw await sveltekitError(err, 'Linking the user and their awarded badges', route);
    }
  }

  return user;
}