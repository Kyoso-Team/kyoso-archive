// import env from '$lib/server/env';
// import db from '$db';
// import DiscordOauth2 from 'discord-oauth2';
// import {
//   Country,
//   dbStaffMember,
//   dbStaffMemberToStaffRole,
//   dbStaffRole,
//   dbTournament,
//   User
// } from '$db/schema';
// import { t, tryCatch } from '$trpc';
// import { z } from 'zod';
// import { Auth as OsuAuth, Client } from 'osu-web.js';
// import { signJWT, verifyJWT } from '$lib/jwt';
// import { TRPCError } from '@trpc/server';
// import { customAlphabet } from 'nanoid';
// import { and, eq, inArray } from 'drizzle-orm';
// import { findFirst, findFirstOrThrow, getRowCount } from '$lib/server-utils';
// import type { InferInsertModel } from 'drizzle-orm';
// import type { TokenRequestResult, User } from 'discord-oauth2';
// import type { SessionUser } from '$types';
// import type { Cookies } from '@sveltejs/kit';
// import type { Token, UserExtended } from 'osu-web.js';

// const osuAuth = new OsuAuth(
//   env.PUBLIC_OSU_CLIENT_ID,
//   env.OSU_CLIENT_SECRET,
//   env.PUBLIC_OSU_REDIRECT_URI
// ).authorizationCodeGrant(['identify', 'public']);

// const discordAuthParams = {
//   clientId: env.PUBLIC_DISCORD_CLIENT_ID,
//   clientSecret: env.DISCORD_CLIENT_SECRET,
//   redirectUri: env.PUBLIC_DISCORD_REDIRECT_URI
// };

// const discordAuth = new DiscordOauth2(discordAuthParams);
// const scope = ['identify'];
// const userSelect = {
//   id: User.id,
//   osuUsername: User.osuUsername,
//   discordUsername: User.discordUsername,
//   discordDiscriminator: User.discordDiscriminator,
//   isAdmin: User.isAdmin,
//   updatedAt: User.updatedApiDataAt,
//   osuUserId: User.osuUserId
// } as const;
// const cookiesOptions = {
//   path: '/'
// } as const;

// function getData(
//   osuToken: Token,
//   discordToken: TokenRequestResult,
//   osuProfile: UserExtended & {
//     is_restricted: boolean;
//   },
//   discordProfile: User
// ): {
//   user: Omit<InferInsertModel<typeof User>, 'id' | 'apiKey' | 'countryId'>;
//   country: Omit<InferInsertModel<typeof Country>, 'id'>;
// } {
//   return {
//     user: {
//       osuAccessToken: osuToken.access_token,
//       osuRefreshToken: osuToken.refresh_token,
//       discordAccesstoken: discordToken.access_token,
//       discordRefreshToken: discordToken.refresh_token,
//       discordDiscriminator: discordProfile.discriminator,
//       discordUserId: discordProfile.id,
//       discordUsername: discordProfile.username,
//       osuUserId: osuProfile.id,
//       osuUsername: osuProfile.username,
//       isRestricted: osuProfile.is_restricted,
//       rank: osuProfile.statistics.global_rank,
//       isAdmin: env.ADMIN_BY_DEFAULT.includes(osuProfile.id)
//     },
//     country: {
//       code: osuProfile.country.code,
//       name: osuProfile.country.name
//     }
//   };
// }

// async function getOsuProfile(osuToken: Token) {
//   return await tryCatch(
//     async () => await new Client(osuToken.access_token).users.getSelf(),
//     "Can't get osu! profile data."
//   );
// }

// /**
//  * *may* be used for the process of changing discord account
//  * could move it and `getOsuProfile` to `getProfiles` if it's not the case
//  */
// async function getDiscordProfile(discordToken: TokenRequestResult) {
//   return await tryCatch(
//     async () => await discordAuth.getUser(discordToken.access_token as string),
//     "Can't get Discord profile data."
//   );
// }

// // exists for convenience
// async function getProfiles(osuToken: Token, discordToken: TokenRequestResult) {
//   return await Promise.all([getOsuProfile(osuToken), getDiscordProfile(discordToken)]);
// }

// function getStoredUser<
//   T extends {
//     id: number;
//     osuUserId: number;
//     osuUsername: string;
//     discordUsername: string;
//     discordDiscriminator: string;
//     isAdmin: boolean;
//     updatedAt: Date;
//   }
// >(user: T): SessionUser {
//   return {
//     id: user.id,
//     username: user.osuUsername,
//     discordTag: `${user.discordUsername}#${user.discordDiscriminator}`,
//     isAdmin: user.isAdmin,
//     updatedAt: user.updatedAt,
//     osuUserId: user.osuUserId
//   };
// }

// function invalidateCookies(cookies: Cookies, error?: string): never {
//   cookies.delete('session', cookiesOptions);
//   cookies.delete('osu_token', cookiesOptions);

//   throw new TRPCError({
//     code: 'INTERNAL_SERVER_ERROR',
//     message: error || 'Invalid cookies.'
//   });
// }

// // Add the current developer as a staff for all tournaments
// async function addUserToTournaments(user: { id: number }) {
//   if (env.NODE_ENV !== 'development') return;

//   let tournaments = await db
//     .select({
//       id: dbTournament.id,
//       debuggerRoleId: dbStaffRole.id
//     })
//     .from(dbTournament)
//     .innerJoin(dbStaffRole, eq(dbStaffRole.tournamentId, dbTournament.id))
//     .where(eq(dbStaffRole.order, 0));

//   let staffMemberCount = await getRowCount(
//     dbStaffMember,
//     and(
//       inArray(
//         dbStaffMember.tournamentId,
//         tournaments.map(({ id }) => id)
//       ),
//       eq(dbStaffMember.userId, user.id)
//     )
//   );

//   if (staffMemberCount > 0) return;

//   await db.transaction(async (tx) => {
//     let staffMembers = await tx
//       .insert(dbStaffMember)
//       .values(
//         tournaments.map(({ id }) => ({
//           tournamentId: id,
//           userId: user.id
//         }))
//       )
//       .returning({ id: dbStaffMember.id });

//     await tx.insert(dbStaffMemberToStaffRole).values(
//       staffMembers.map(({ id }, i) => ({
//         staffMemberId: id,
//         staffRoleId: tournaments[i].debuggerRoleId
//       }))
//     );
//   });
// }

// async function createOrGetCountry(countryData: ReturnType<typeof getData>['country']) {
//   return await db.transaction(async (tx) => {
//     let country = findFirst(
//       await tx
//         .insert(Country)
//         .values(countryData)
//         .onConflictDoNothing({ target: Country.code })
//         .returning({
//           id: Country.id
//         })
//     );

//     if (!country) {
//       country = findFirstOrThrow(
//         await tx
//           .select({
//             id: Country.id
//           })
//           .from(Country)
//           .where(eq(Country.code, countryData.code)),
//         'country'
//       );
//     }

//     return country;
//   });
// }

// async function login(osuToken: Token, discordToken: TokenRequestResult): Promise<string> {
//   let [osuProfile, discordProfile] = await getProfiles(osuToken, discordToken);
//   let data = getData(osuToken, discordToken, osuProfile, discordProfile);
//   let apiKey = customAlphabet(
//     '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
//     24
//   )();

//   let user = await tryCatch(async () => {
//     let country = await createOrGetCountry(data.country);

//     return findFirstOrThrow(
//       await db
//         .insert(User)
//         .values({
//           ...data.user,
//           apiKey,
//           countryId: country.id
//         })
//         .onConflictDoUpdate({
//           target: User.osuUserId,
//           set: {
//             ...data.user,
//             countryId: country.id
//           }
//         })
//         .returning(userSelect),
//       'user'
//     );
//   }, "Can't create or update user.");

//   let storedUser = getStoredUser(user);
//   return signJWT(storedUser);
// }

// export const authRouter = t.router({
//   handleOsuAuth: t.procedure.input(z.string()).query(async ({ input, ctx }) => {
//     let osuToken = await tryCatch(
//       async () => await osuAuth.requestToken(input),
//       "Can't get osu! OAuth token."
//     );

//     /**
//      * Get the osu! id of the user directly from the token
//      * The id can also be obtained by doing a request with that token,
//      * but the time we spend doing the request is time wasted if user is registering
//      */
//     let userId = 0;
//     let accessToken = osuToken.access_token;
//     let tokenPayload = JSON.parse(
//       Buffer.from(
//         accessToken.substring(accessToken.indexOf('.') + 1, accessToken.lastIndexOf('.')),
//         'base64'
//       ).toString('ascii')
//     );
//     if (tokenPayload.sub && tokenPayload.sub.length && !isNaN(+tokenPayload.sub)) {
//       userId = Number(tokenPayload.sub);
//     }

//     let user = findFirst(
//       await db
//         .select({
//           id: User.id,
//           discordRefreshToken: User.discordRefreshToken
//         })
//         .from(User)
//         .where(eq(User.osuUserId, userId))
//     );

//     try {
//       // Avoid prompting user for discord auth if possible
//       if (!user) {
//         throw new TRPCError({
//           code: 'INTERNAL_SERVER_ERROR',
//           message: 'User does not exist yet.'
//         });
//       }

//       let discordToken = await discordAuth.tokenRequest({
//         ...discordAuthParams,
//         grantType: 'refresh_token',
//         scope,
//         refreshToken: user.discordRefreshToken
//       });

//       await addUserToTournaments(user);
//       ctx.cookies.set('session', await login(osuToken, discordToken), cookiesOptions);
//       return '/';
//     } catch (e) {
//       let err = e as
//         | {
//             message: string;
//             response?: {
//               error: string;
//             };
//           }
//         | undefined;

//       if (err?.message === 'User does not exist yet.' || err?.response?.error === 'invalid_grant') {
//         // Prompt user for discord auth
//         ctx.cookies.set('osu_token', signJWT(osuToken), cookiesOptions);
//         return discordAuth.generateAuthUrl({ scope });
//       } else {
//         // Something actually went wrong, throw error
//         throw new TRPCError({
//           code: 'INTERNAL_SERVER_ERROR',
//           message: 'Failed to authenticate user.',
//           cause: e
//         });
//       }
//     }
//   }),
//   handleDiscordAuth: t.procedure.input(z.string()).query(async ({ input, ctx }) => {
//     let discordToken = await tryCatch(async () => {
//       return await discordAuth.tokenRequest({
//         ...discordAuthParams,
//         grantType: 'authorization_code',
//         scope,
//         code: input
//       });
//     }, "Can't get Discord OAuth token.");

//     let osuToken = verifyJWT<Token>(ctx.cookies.get('osu_token'));
//     if (!osuToken) {
//       // User may be changing their discord account
//       let storedUser = verifyJWT<SessionUser>(ctx.cookies.get('session'));
//       if (!storedUser) {
//         invalidateCookies(ctx.cookies);
//       }

//       let discordProfile = await getDiscordProfile(discordToken);
//       let updatedUser = findFirstOrThrow(
//         await db
//           .update(User)
//           .set({
//             discordAccesstoken: discordToken.access_token,
//             discordRefreshToken: discordToken.refresh_token,
//             discordUserId: discordProfile.id,
//             discordUsername: discordProfile.username,
//             discordDiscriminator: discordProfile.discriminator
//           })
//           .where(eq(User.osuUserId, storedUser.osuUserId))
//           .returning(userSelect),
//         'user'
//       );

//       storedUser = getStoredUser(updatedUser);
//       ctx.cookies.set('session', signJWT(storedUser), cookiesOptions);
//       return '/user/settings';
//     } else {
//       // User is logging in and went through osu auth stuff
//       ctx.cookies.delete('osu_token', cookiesOptions);

//       let jwt = await login(osuToken, discordToken);
//       await addUserToTournaments(verifyJWT(jwt) as SessionUser);

//       ctx.cookies.set('session', jwt, cookiesOptions);
//       return '/';
//     }
//   }),
//   logout: t.procedure.query(({ ctx }) => {
//     ctx.cookies.delete('session', cookiesOptions);
//   }),
//   updateUser: t.procedure.query(async ({ ctx }) => {
//     let storedUser = verifyJWT<SessionUser>(ctx.cookies.get('session'));
//     if (!storedUser) {
//       invalidateCookies(ctx.cookies);
//     }

//     try {
//       let user = await tryCatch(async () => {
//         return findFirstOrThrow(
//           await db
//             .select({
//               id: User.id,
//               isAdmin: User.isAdmin,
//               osuRefreshToken: User.osuRefreshToken,
//               discordRefreshToken: User.discordRefreshToken
//             })
//             .from(User)
//             .where(eq(User.id, storedUser?.id || 0)),
//           'user'
//         );
//       }, "Can't refresh user data.");

//       if (new Date().getTime() - new Date(storedUser.updatedAt).getTime() >= 86_400_000) {
//         let [osuToken, discordToken] = await Promise.all([
//           tryCatch(
//             async () => await osuAuth.refreshToken(user.osuRefreshToken),
//             "Can't refresh osu! OAuth token."
//           ),
//           tryCatch(async () => {
//             return await discordAuth.tokenRequest({
//               ...discordAuthParams,
//               grantType: 'refresh_token',
//               scope,
//               refreshToken: user.discordRefreshToken
//             });
//           }, "Can't refresh Discord OAuth token.")
//         ]);
//         let [osuProfile, discordProfile] = await getProfiles(osuToken, discordToken);
//         let data = getData(osuToken, discordToken, osuProfile, discordProfile);

//         let updatedUser = await tryCatch(async () => {
//           let country = await createOrGetCountry(data.country);

//           return findFirstOrThrow(
//             await db
//               .update(User)
//               .set({
//                 ...data.user,
//                 countryId: country.id
//               })
//               .where(eq(User.id, user.id))
//               .returning(userSelect),
//             'user'
//           );
//         }, "Can't update user.");

//         storedUser = getStoredUser(updatedUser);
//       } else {
//         storedUser = {
//           ...storedUser,
//           isAdmin: user.isAdmin
//         };
//       }

//       ctx.cookies.set('session', signJWT(storedUser), cookiesOptions);
//       return storedUser;
//     } catch (e) {
//       invalidateCookies(ctx.cookies, (e as { message: string }).message);
//     }
//   }),
//   generateDiscordAuthLink: t.procedure.query(({ ctx }) => {
//     if (verifyJWT<SessionUser>(ctx.cookies.get('session'))) {
//       return discordAuth.generateAuthUrl({ scope });
//     } else {
//       return '/';
//     }
//   })
// });
