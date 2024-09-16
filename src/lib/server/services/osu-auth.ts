import { Auth } from 'osu-web.js';
import { env } from '$lib/server/env';

export const osuAuth = new Auth(
  env.PUBLIC_OSU_CLIENT_ID,
  env.OSU_CLIENT_SECRET,
  env.PUBLIC_OSU_REDIRECT_URI
).authorizationCodeGrant(['identify', 'public']);
