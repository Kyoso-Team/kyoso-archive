import env from '$lib/env/server';
import prisma from '$prisma';
import DiscordOauth2 from 'discord-oauth2';
import { t, tryCatch } from '$trpc';
import { z } from 'zod';
import { Auth as OsuAuth, Client, type Token, type UserExtended } from 'osu-web.js';
import { signJWT, verifyJWT } from '$lib/jwt';
import { TRPCError } from '@trpc/server';
import { customAlphabet } from 'nanoid';
import type { TokenRequestResult, User } from 'discord-oauth2';
import type { Prisma } from '@prisma/client';
import type { SessionUser } from '$types';

const osuAuth = new OsuAuth(
  env.PUBLIC_OSU_CLIENT_ID,
  env.OSU_CLIENT_SECRET,
  env.PUBLIC_OSU_REDIRECT_URI
).authorizationCodeGrant(['identify', 'public']);

const discordAuthParams = {
  clientId: env.PUBLIC_DISCORD_CLIENT_ID,
  clientSecret: env.DISCORD_CLIENT_SECRET,
  redirectUri: env.PUBLIC_DISCORD_REDIRECT_URI
};

const discordAuth = new DiscordOauth2(discordAuthParams);
const scope = ['identify'];
const userSelect = {
  id: true,
  osuUsername: true,
  discordUsername: true,
  discordDiscriminator: true,
  isAdmin: true,
  updatedAt: true,
  osuUserId: true
};
const cookiesOptions = {
  path: '/'
};

function getData(
  osuToken: Token,
  discordToken: TokenRequestResult,
  osuProfile: UserExtended & {
    is_restricted: boolean;
  },
  discordProfile: User
): Omit<Prisma.UserCreateInput, 'apiKey'> {
  return {
    osuAccessToken: osuToken.access_token,
    osuRefreshToken: osuToken.refresh_token,
    discordAccesstoken: discordToken.access_token,
    discordRefreshToken: discordToken.refresh_token,
    discordDiscriminator: Number(discordProfile.discriminator),
    discordUserId: discordProfile.id,
    discordUsername: discordProfile.username,
    osuUserId: osuProfile.id,
    osuUsername: osuProfile.username,
    isRestricted: osuProfile.is_restricted,
    isAdmin: env.ADMIN_BY_DEFAULT.includes(osuProfile.id),
    country: {
      connectOrCreate: {
        create: {
          code: osuProfile.country.code,
          name: osuProfile.country.name
        },
        where: {
          code: osuProfile.country.code
        }
      }
    }
  };
}

async function getOsuProfile(osuToken: Token) {
  return await tryCatch(
    async () => await new Client(osuToken.access_token as string).users.getSelf(),
    "Can't get osu! profile data."
  )
}

/** 
 * *may* be used for the process of changing discord account
 * could move it and `getOsuProfile` to `getProfiles` if it's not the case
 */ 
async function getDiscordProfile(discordToken: TokenRequestResult) {
  return await tryCatch(
    async () => await discordAuth.getUser(discordToken.access_token as string),
    "Can't get Discord profile data."
  )
}

// exists for convenience
async function getProfiles(osuToken: Token, discordToken: TokenRequestResult) {
  return await Promise.all([getOsuProfile(osuToken), getDiscordProfile(discordToken)]);
}

function getStoredUser<
  T extends {
    id: number;
    osuUserId: number;
    osuUsername: string;
    discordUsername: string;
    discordDiscriminator: number;
    isAdmin: boolean;
    updatedAt: Date;
  }
>(user: T): SessionUser {
  return {
    id: user.id,
    username: user.osuUsername,
    discordTag: `${user.discordUsername}#${user.discordDiscriminator}`,
    isAdmin: user.isAdmin,
    updatedAt: user.updatedAt,
    osuUserId: user.osuUserId
  };
}

export const authRouter = t.router({
  handleOsuAuth: t.procedure.input(z.string()).query(async ({ input, ctx }) => {
    let token = await tryCatch(
      async () => await osuAuth.requestToken(input),
      "Can't get osu! OAuth token."
    );
    
    /**
     * Get the osu! id of the user directly from the token
     * The id can also be obtained by doing a request with that token,
     * but the time we spend doing the request is time wasted if user is registering
     */
    let userId = 0
    let accessToken = token.access_token
    let tokenPayload = JSON.parse(Buffer.from(accessToken.substring(accessToken.indexOf(".") + 1, accessToken.lastIndexOf(".")), "base64").toString('ascii'))
		if (tokenPayload.sub && tokenPayload.sub.length && !isNaN(+tokenPayload.sub)) {
      userId = Number(tokenPayload.sub)
    }

    let user = await prisma.user.findUnique({
      where: {
        osuUserId: userId
      }
    })

    if (userId !== 0 && user) { // User is registered and logging in, skip discord by simply running `updateUser`
      let storedUser = getStoredUser(user);
      ctx.cookies.set('session', signJWT(storedUser), cookiesOptions);
      return "/"
    } else { // User is currently registering, make them link their discord
      ctx.cookies.set('osu_token', signJWT(token), cookiesOptions);
      return discordAuth.generateAuthUrl({ scope });
    }
  }),
  handleDiscordAuth: t.procedure.input(z.string()).query(async ({ input, ctx }) => {
    let token = await tryCatch(async () => {
      return await discordAuth.tokenRequest({
        ...discordAuthParams,
        grantType: 'authorization_code',
        scope,
        code: input
      });
    }, "Can't get Discord OAuth token.");

    ctx.cookies.set('discord_token', signJWT(token), cookiesOptions);
  }),
  login: t.procedure.query(async ({ ctx }) => {
    let osuToken = verifyJWT<Token>(ctx.cookies.get('osu_token'));
    let discordToken = verifyJWT<TokenRequestResult>(ctx.cookies.get('discord_token'));

    ctx.cookies.delete('osu_token', cookiesOptions);
    ctx.cookies.delete('discord_token', cookiesOptions);

    if (!osuToken || !discordToken) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Invalid login cookies.'
      });
    }

    let [osuProfile, discordProfile] = await getProfiles(osuToken, discordToken);
    let data = getData(osuToken, discordToken, osuProfile, discordProfile);
    let apiKey = customAlphabet(
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      24
    )();

    let user = await tryCatch(async () => {
      return await prisma.user.upsert({
        create: {
          ...data,
          apiKey
        },
        where: {
          osuUserId: osuProfile.id
        },
        update: data,
        select: userSelect
      });
    }, "Can't create or update user.");

    let storedUser = getStoredUser(user);
    ctx.cookies.set('session', signJWT(storedUser), cookiesOptions);
  }),
  logout: t.procedure.query(({ ctx }) => {
    ctx.cookies.delete('session', cookiesOptions);
  }),
  changeDiscord: t.procedure.query(async ({ ctx }) => {
    let storedUser = verifyJWT<SessionUser>(ctx.cookies.get('session'));
    let discordToken = verifyJWT<TokenRequestResult>(ctx.cookies.get('discord_token'));
    ctx.cookies.delete('discord_token', cookiesOptions);

    if (!storedUser || !discordToken) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Invalid cookies.'
      });
    }

    let discordProfile = await getDiscordProfile(discordToken);
    let updatedUser = await prisma.user.update({
      where: {
        osuUserId: storedUser.osuUserId
      },
      data: {
        discordAccesstoken: discordToken.access_token,
        discordRefreshToken: discordToken.refresh_token,
        discordUserId: discordProfile.id,
        discordUsername: discordProfile.username,
        discordDiscriminator: Number(discordProfile.discriminator)
      }
    });

    storedUser = getStoredUser(updatedUser);
    ctx.cookies.set('session', signJWT(storedUser), cookiesOptions);
  }),
  updateUser: t.procedure.query(async ({ ctx }) => {
    let storedUser = verifyJWT<SessionUser>(ctx.cookies.get('session'));

    if (!storedUser) {
      ctx.cookies.delete('session', cookiesOptions);

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Invalid user cookie.'
      });
    }

    let user = await tryCatch(async () => {
      return await prisma.user.findUniqueOrThrow({
        where: {
          id: storedUser?.id
        },
        select: {
          id: true,
          isAdmin: true,
          osuRefreshToken: true,
          discordRefreshToken: true
        }
      });
    }, "Can't refresh user data.");

    if (new Date().getTime() - new Date(storedUser.updatedAt).getTime() >= 86_400_000) {
      let [osuToken, discordToken] = await Promise.all([
        tryCatch(
          async () => await osuAuth.refreshToken(user.osuRefreshToken),
          "Can't refresh osu! OAuth token."
        ),
        tryCatch(async () => {
          return await discordAuth.tokenRequest({
            ...discordAuthParams,
            grantType: 'refresh_token',
            scope,
            refreshToken: user.discordRefreshToken
          });
        }, "Can't refresh Discord OAuth token.")
      ]);
      let [osuProfile, discordProfile] = await getProfiles(osuToken, discordToken);
      let data = getData(osuToken, discordToken, osuProfile, discordProfile);

      let updatedUser = await tryCatch(async () => {
        return await prisma.user.update({
          where: {
            id: user.id
          },
          data,
          select: userSelect
        });
      }, "Can't update user.");

      storedUser = getStoredUser(updatedUser);
    } else {
      storedUser = {
        ...storedUser,
        isAdmin: user.isAdmin
      };
    }

    ctx.cookies.set('session', signJWT(storedUser), cookiesOptions);
    return storedUser;
  }),
  generateDiscordAuthLink: t.procedure.query(({ ctx }) => {
    if (verifyJWT<SessionUser>(ctx.cookies.get('session'))) {
      return discordAuth.generateAuthUrl({ scope });
    } else {
      return "/"
    }
  })
});
