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
import type { Cookies } from '@sveltejs/kit';

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
    discordDiscriminator: discordProfile.discriminator,
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
    async () => await new Client(osuToken.access_token).users.getSelf(),
    "Can't get osu! profile data."
  );
}

/**
 * *may* be used for the process of changing discord account
 * could move it and `getOsuProfile` to `getProfiles` if it's not the case
 */
async function getDiscordProfile(discordToken: TokenRequestResult) {
  return await tryCatch(
    async () => await discordAuth.getUser(discordToken.access_token as string),
    "Can't get Discord profile data."
  );
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
    discordDiscriminator: string;
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

function invalidateCookies(cookies: Cookies, error?: string): never {
  cookies.delete('session', cookiesOptions);
  cookies.delete('osu_token', cookiesOptions);

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error || 'Invalid cookies.'
  });
}

// Add the current developer as a staff for all tournaments
async function addUserToTournaments(user: { id: number }) {
  if (env.NODE_ENV === 'development') {
    let tournaments = await prisma.tournament.findMany({
      select: {
        id: true
      }
    });

    for (let i = 0; i < tournaments.length; i++) {
      let tournamentId = tournaments[i].id;

      let existingStaffRole = await prisma.staffRole.findUnique({
        where: {
          name_tournamentId: {
            tournamentId,
            name: 'Debugger'
          }
        }
      });

      if (!existingStaffRole) {
        await prisma.$transaction(async (tx) => {
          let staffRole = await tx.staffRole.create({
            data: {
              tournamentId,
              name: 'Debugger',
              order: 0,
              permissions: ['Debug']
            },
            select: {
              id: true
            }
          });

          await tx.staffMember.create({
            data: {
              tournamentId,
              roles: {
                connect: {
                  id: staffRole.id
                }
              },
              userId: user.id
            }
          });
        });
      }
    }
  }
}

async function login(osuToken: Token, discordToken: TokenRequestResult): Promise<string> {
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
  return signJWT(storedUser);
}

export const authRouter = t.router({
  handleOsuAuth: t.procedure.input(z.string()).query(async ({ input, ctx }) => {
    let osuToken = await tryCatch(
      async () => await osuAuth.requestToken(input),
      "Can't get osu! OAuth token."
    );

    /**
     * Get the osu! id of the user directly from the token
     * The id can also be obtained by doing a request with that token,
     * but the time we spend doing the request is time wasted if user is registering
     */
    let userId = 0;
    let accessToken = osuToken.access_token;
    let tokenPayload = JSON.parse(
      Buffer.from(
        accessToken.substring(accessToken.indexOf('.') + 1, accessToken.lastIndexOf('.')),
        'base64'
      ).toString('ascii')
    );
    if (tokenPayload.sub && tokenPayload.sub.length && !isNaN(+tokenPayload.sub)) {
      userId = Number(tokenPayload.sub);
    }

    let user = await prisma.user.findUnique({
      where: {
        osuUserId: userId
      },
      select: {
        id: true,
        discordRefreshToken: true
      }
    });

    try {
      // Avoid prompting user for discord auth if possible
      if (!user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'User does not exist yet.'
        });
      }

      let discordToken = await discordAuth.tokenRequest({
        ...discordAuthParams,
        grantType: 'refresh_token',
        scope,
        refreshToken: user.discordRefreshToken
      });

      await addUserToTournaments(user);
      ctx.cookies.set('session', await login(osuToken, discordToken), cookiesOptions);
      return '/';
    } catch (e) {
      let err = e as
        | {
            message: string;
            response?: {
              error: string;
            };
          }
        | undefined;

      if (err?.message === 'User does not exist yet.' || err?.response?.error === 'invalid_grant') {
        // Prompt user for discord auth
        ctx.cookies.set('osu_token', signJWT(osuToken), cookiesOptions);
        return discordAuth.generateAuthUrl({ scope });
      } else {
        // Something actually went wrong, throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to authenticate user.',
          cause: e
        });
      }
    }
  }),
  handleDiscordAuth: t.procedure.input(z.string()).query(async ({ input, ctx }) => {
    let discordToken = await tryCatch(async () => {
      return await discordAuth.tokenRequest({
        ...discordAuthParams,
        grantType: 'authorization_code',
        scope,
        code: input
      });
    }, "Can't get Discord OAuth token.");

    let osuToken = verifyJWT<Token>(ctx.cookies.get('osu_token'));
    if (!osuToken) {
      // User may be changing their discord account
      let storedUser = verifyJWT<SessionUser>(ctx.cookies.get('session'));
      if (!storedUser) {
        invalidateCookies(ctx.cookies);
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
          discordDiscriminator: discordProfile.discriminator
        }
      });

      storedUser = getStoredUser(updatedUser);
      ctx.cookies.set('session', signJWT(storedUser), cookiesOptions);
      return '/user/settings';
    } else {
      // User is logging in and went through osu auth stuff
      ctx.cookies.delete('osu_token', cookiesOptions);

      let jwt = await login(osuToken, discordToken);
      await addUserToTournaments(verifyJWT(jwt) as SessionUser);

      ctx.cookies.set('session', jwt, cookiesOptions);
      return '/';
    }
  }),
  logout: t.procedure.query(({ ctx }) => {
    ctx.cookies.delete('session', cookiesOptions);
  }),
  updateUser: t.procedure.query(async ({ ctx }) => {
    let storedUser = verifyJWT<SessionUser>(ctx.cookies.get('session'));
    if (!storedUser) {
      invalidateCookies(ctx.cookies);
    }

    try {
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
    } catch (e) {
      invalidateCookies(ctx.cookies, (e as { message: string }).message);
    }
  }),
  generateDiscordAuthLink: t.procedure.query(({ ctx }) => {
    if (verifyJWT<SessionUser>(ctx.cookies.get('session'))) {
      return discordAuth.generateAuthUrl({ scope });
    } else {
      return '/';
    }
  })
});
