import env from '$lib/server/env';
import { db, User } from '$db';
import { Auth } from 'osu-web.js';
import { createSession, upsertDiscordUser, upsertOsuUser } from '$lib/server/helpers/auth';
import { sql } from 'drizzle-orm';
import { pick } from '$lib/server/utils';
import type DiscordOAuth2 from 'discord-oauth2';
import type { AuthSession } from '$types';
import type { AnyPgTable } from 'drizzle-orm/pg-core';

/** https://www.postgresql.org/docs/current/sql-truncate.html */
export async function truncateTables(tables: AnyPgTable | AnyPgTable[]) {
  const truncate = Array.isArray(tables)
    ? sql.join(tables.map((table) => table), sql`, `)
    : tables;
  await db.execute(sql`truncate ${truncate} restart identity cascade`);
}

// export async function createMockSession(sessionAttributes?: Partial<Pick<AuthSession, 'admin' | 'approvedHost'>>) {
//   const osuAuth = new Auth(
//     env.PUBLIC_OSU_CLIENT_ID,
//     env.OSU_CLIENT_SECRET,
//     env.PUBLIC_OSU_REDIRECT_URI
//   );
//   let osuToken = await osuAuth.clientCredentialsGrant();

//   osuToken = await fetch('https://osu.ppy.sh/oauth/token', {
//     method: 'POST',
//     body: JSON.stringify({
//       client_id: env.PUBLIC_OSU_CLIENT_ID,
//       client_secret: env.OSU_CLIENT_SECRET,
//       grant_type: 'client_credentials',
//       scope: 'identify'
//     }),
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Basic ${btoa(`${env.PUBLIC_OSU_CLIENT_ID}:${env.OSU_CLIENT_SECRET}`)}`
//     }
//   }).then((r) => r.json());

//   const discordtokenResp = await fetch('https://discord.com/api/v10/oauth2/token', {
//     method: 'POST',
//     body: JSON.stringify({
//       grant_type: 'client_credentials',
//       scope: 'identify'
//     }),
//     headers: {
//       'Content-Type': 'application/x-www-form-urlencoded',
//       'Authorization': `Basic ${btoa(`${env.PUBLIC_DISCORD_CLIENT_ID}:${env.DISCORD_CLIENT_SECRET}`)}`
//     }
//   });
//   const discordToken: DiscordOAuth2.TokenRequestResult = await discordtokenResp.json();

//   const tokensIssuedAt = new Date();
//   const route = { id: null };
//   const osuUser = await upsertOsuUser({
//     access_token: osuToken.access_token,
//     expires_in: osuToken.expires_in,
//     token_type: osuToken.token_type,
//     refresh_token: 'xxx'
//   }, tokensIssuedAt, route);
//   const discordUser = await upsertDiscordUser({
//     access_token: discordToken.access_token,
//     expires_in: discordToken.expires_in,
//     scope: discordToken.scope,
//     token_type: discordToken.token_type,
//     refresh_token: 'xxx'
//   }, tokensIssuedAt, route);

//   const user = await db
//       .insert(User)
//       .values({
//         discordUserId: discordUser.id,
//         osuUserId: osuUser.id,
//         admin: sessionAttributes?.admin,
//         approvedHost: sessionAttributes?.approvedHost
//       })
//       .returning(pick(User, ['id', 'updatedApiDataAt', 'admin', 'approvedHost']))
//       .then((user) => user[0]);
//   const session = await createSession(user.id, '127.0.0.1', 'User Agent', route);

//   const authSession: AuthSession = {
//     sessionId: session.id,
//     userId: user.id,
//     admin: user.admin,
//     approvedHost: user.approvedHost,
//     updatedApiDataAt: user.updatedApiDataAt.getTime(),
//     discord: {
//       id: discordUser.id,
//       username: discordUser.username
//     },
//     osu: {
//       id: osuUser.id,
//       username: osuUser.username
//     }
//   };

//   return authSession;
// }