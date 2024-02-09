import { Country, OsuBadge, OsuUser, OsuUserAwardedBadge, db } from '$db';
import { Client } from 'osu-web.js';
import { error, redirect } from '@sveltejs/kit';
import { kyosoError, signJWT } from '$lib/server-utils';
import { discordAuth, osuAuth } from '$lib/constants';
import type { Token } from 'osu-web.js';
import type { RequestHandler } from './$types';
import type { AuthUser } from '$types';

export const GET = (async ({ url, route, cookies }) => {
  const redirectUri = url.searchParams.get('state') || undefined;
  const code = url.searchParams.get('code');

  if (!code) {
    throw error(400, 'URL search parameter "code" is undefined');
  }

  let token: Token | undefined;
  
  try {
    token = await osuAuth.requestToken(code);
  } catch (err) {
    throw kyosoError(err, 'Getting the osu! OAuth token', route);
  }

  if (!token) return new Response(null);

  const osu = new Client(token.access_token);
  let user: Awaited<ReturnType<Client['users']['getSelf']>> | undefined;

  try {
    user = await osu.users.getSelf({
      urlParams: {
        mode: 'osu'
      }
    });
  } catch (err) {
    throw kyosoError(err, 'Getting the user\'s osu! data', route);
  }

  if (!user) return new Response(null);

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
    throw kyosoError(err, 'Creating the user\'s country', route);
  }

  const badges: typeof OsuBadge.$inferInsert[] = user.badges.map((badge) => ({
    description: badge.description,
    imgFileName: badge.image_url.split('/').at(-1) || ''
  }));

  try {
    await db
      .insert(OsuBadge)
      .values(badges)
      .onConflictDoNothing({
        target: [OsuBadge.imgFileName]
      });
  } catch (err) {
    throw kyosoError(err, 'Creating the user\'s badges', route);
  }

  try {
    await db
      .insert(OsuUser)
      .values({
        accessToken: token.access_token,
        countryCode: user.country.code,
        isRestricted: user.is_restricted,
        osuUserId: user.id,
        refreshToken: token.refresh_token,
        username: user.username,
        globalStdRank: user.statistics.global_rank
      })
      .onConflictDoUpdate({
        target: [OsuUser.osuUserId],
        set: {
          accessToken: token.access_token,
          countryCode: user.country.code,
          isRestricted: user.is_restricted,
          refreshToken: token.refresh_token,
          username: user.username,
          globalStdRank: user.statistics.global_rank
        }
      });
  } catch (err) {
    throw kyosoError(err, 'Upserting the user\'s osu! data', route);
  }

  // NOTE: If a badge has been removed from the user, this case isn't hadled due to the very high unlikelyhood of this happening

  const awardedBadges: typeof OsuUserAwardedBadge.$inferInsert[] = user.badges.map((badge) => ({
    awardedAt: new Date(badge.awarded_at),
    osuBadgeImgFileName: badge.image_url.split('/').at(-1) || '',
    osuUserId: user?.id || 0
  }));

  try {
    await db
      .insert(OsuUserAwardedBadge)
      .values(awardedBadges)
      .onConflictDoNothing({
        target: [OsuUserAwardedBadge.osuBadgeImgFileName, OsuUserAwardedBadge.osuUserId]
      });
  } catch (err) {
    throw kyosoError(err, 'Linking the user and their awarded badges', route);
  }

  const discordAuthUrl = discordAuth.generateAuthUrl({
    scope: ['identify'],
    state: redirectUri
  });

  const osuProfile: AuthUser['osu'] = {
    id: user.id,
    username: user.username
  };

  cookies.set('temp_osu_profile', signJWT(osuProfile), {
    path: '/'
  });

  throw redirect(302, discordAuthUrl);
}) satisfies RequestHandler;
