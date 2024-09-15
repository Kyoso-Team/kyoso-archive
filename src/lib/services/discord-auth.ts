import DiscordOauth2 from 'discord-oauth2';
import { env } from '$lib/server/env';

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
