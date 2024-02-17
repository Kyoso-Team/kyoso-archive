import env from '$lib/env/server';
import DiscordOauth2 from 'discord-oauth2';
import { Auth } from 'osu-web.js';
// import type { TournamentService } from '$types';

// export const services: Record<
//   TournamentService | string,
//   {
//     soloPrice: number;
//     teamsPrice: number;
//   }
// > = {
//   registrations: {
//     soloPrice: 3,
//     teamsPrice: 3.5
//   },
//   mappooling: {
//     soloPrice: 2.5,
//     teamsPrice: 2.5
//   },
//   referee: {
//     soloPrice: 3,
//     teamsPrice: 3
//   },
//   stats: {
//     soloPrice: 1.5,
//     teamsPrice: 2
//   },
//   pickems: {
//     soloPrice: 2,
//     teamsPrice: 2
//   }
// };

// export const firsBlogPostTimestmap = 1_687_721_464_000;

export const discordMainAuthOptions = {
  clientId: env.PUBLIC_DISCORD_CLIENT_ID,
  clientSecret: env.DISCORD_CLIENT_SECRET,
  redirectUri: env.PUBLIC_DISCORD_MAIN_REDIRECT_URI
};

export const discordChangeAccountAuthOptions = {
  clientId: env.PUBLIC_DISCORD_CLIENT_ID,
  clientSecret: env.DISCORD_CLIENT_SECRET,
  redirectUri: env.PUBLIC_DISCORD_CHANGE_ACCOUNT_REDIRECT_URI
};

export const discordMainAuth = new DiscordOauth2(discordMainAuthOptions);
export const discordChangeAccountAuth = new DiscordOauth2(discordChangeAccountAuthOptions);

export const osuAuth = new Auth(
  env.PUBLIC_OSU_CLIENT_ID,
  env.OSU_CLIENT_SECRET,
  env.PUBLIC_OSU_REDIRECT_URI
).authorizationCodeGrant(['identify', 'public']);
