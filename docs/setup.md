# Setup

Setup your development environment.

## Requisites

- Node v18 or greater.
- PNPM (latest).
- Postgres v14 or greater.

## Environment Variables

Setup the environment variables by copying the `.env.example` file, pasting it, and renaming it to `.env` and give each variable the respective necessary value.

- **NODE_ENV**

Specify the environment. Whether it's production or development.

- **DATABASE_URL**

URL of the Postgres database you wish to use for development.

- **JWT_SECRET**

A secret string used to encode and decode JWT tokens.

- **PUBLIC_OSU_CLIENT_ID**, **OSU_CLIENT_SECRET** & **PUBLIC_OSU_REDIRECT_URI**

osu! OAuth related variables. Log into your osu! account and [create an OAuth application](https://osu.ppy.sh/home/account/edit). The application callback URL must match `PUBLIC_OSU_REDIRECT_URI`.

- **PUBLIC_DISCORD_CLIENT_ID**, **DISCORD_CLIENT_SECRET**, **PUBLIC_DISCORD_REDIRECT_URI** & **DISCORD_BOT_TOKEN**

Discord OAuth related variables. Log into your Discord account in a browser and [create an OAuth application](https://discord.com/developers/applications). Under the `OAuth2` menu in the UI, you'll find the first three variables. The redirect URI must match `PUBLIC_DISCORD_REDIRECT_URI`. Under the `Bot` menu, create a bot for the OAuth app and copy its token (no bot permissions need to be specified) and set that as the value for `DISCORD_BOT_TOKEN`.

- **STORAGE_ENDPOINT** & **STORAGE_PASSWORD**

Storage related variables. Log into your Bunny.net account and [create a storage zone](https://dash.bunny.net/storage). Once the storage zone is selected, head to `FTP & API Access` and there you'll find `Username` and `Hostname` from which you can use to create the `STORAGE_ENDPOINT` variable. The `STORAGE_PASSWORD` corresponds to the `Password` shown in the same page as `Username` and `Hostname`.

- **ADMIN_BY_DEFAULT**

Array of osu! user IDs that correspond to users who should be admin by default. In development, this would be an array of a single value (which corresponds to your osu! user ID) since having additional IDs is pointless.

- **PUBLIC_CONTACT_EMAIL**

An email address that users can contact for any inquires. Pointless in development, use any email address you'd like.

## Run Development Server

1. Run `pnpm install` to install all the project's packages.
2. If you don't want to seed the database (even though it's recommended), run `pnpm db:migrate` to apply migrations. Otherwise, run `pnpm db:seed` to reset, migrate and seed the database.
3. Run `pnpm dev` to run the development server.
