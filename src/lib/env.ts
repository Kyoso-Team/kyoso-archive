import { parseEnv } from './helpers';
import { clientEnvSchema } from './schemas';

export const clientEnv = {
  PUBLIC_OSU_CLIENT_ID: Number(import.meta.env.PUBLIC_OSU_CLIENT_ID),
  PUBLIC_OSU_REDIRECT_URI: import.meta.env.PUBLIC_OSU_REDIRECT_URI,
  PUBLIC_DISCORD_CLIENT_ID: import.meta.env.PUBLIC_DISCORD_CLIENT_ID,
  PUBLIC_DISCORD_MAIN_REDIRECT_URI: import.meta.env.PUBLIC_DISCORD_MAIN_REDIRECT_URI,
  PUBLIC_DISCORD_CHANGE_ACCOUNT_REDIRECT_URI: import.meta.env
    .PUBLIC_DISCORD_CHANGE_ACCOUNT_REDIRECT_URI,
  PUBLIC_CONTACT_EMAIL: import.meta.env.PUBLIC_CONTACT_EMAIL || 'example@gmail.com'
};

const env = parseEnv(clientEnvSchema, clientEnv);
export default env;
