# Kyoso

Repository for the Kyoso website.

## Stack

- [pnpm](https://pnpm.io): Package manager
- [SvelteKit](https://kit.svelte.dev): Full-stack framework
- [Zod](https://zod.dev): Validation library
- [Drizzle](https://orm.drizzle.team): ORM for the database
- [PostgreSQL](https://www.postgresql.org): The database itself
- [tRPC](https://trpc.io): Backend / API
- [Taiwind](https://tailwindcss.com): Styling
- [Skeleton](https://www.skeleton.dev): UI library
- [Paypal](https://developer.paypal.com): Payment processing
- [Bunny](https://bunny.net): File storage

## Scripts

Scripts present in the package.json file. Each script must be prepended with `pnpm` or `npm run`.

- `dev`: Start SvelteKit development server.
- `build`: Build SvelteKit app.
- `Preview`: Start a server running the output of the `build` script.
- `check` & `check:watch`: Updates svelte routes with correct type definitions, either with or without watch mode.
- `lint`: Code linting.
- `fmt`: Code formatting.
- `review`: Runs `fmt`, `lint` and `check`, one after the other.
- `db:generate`: Generate a new migration file. Must be used after making changes to the schema (`src/lib/db/schema` folder).
- `db:generate-custom`: Generate a new blank migration file. Usually used to apply queries in `sql/unsupported.sql`.
- `db:migrate`: Apply generated migrations.
- `db:reset`: Resets the database schema (deletes all rows, drops all tables, views, functions, triggers, etc.)
- `db:push`: Push changes without generating a migration file (CURRENTLY BROKEN).
- `db:seed`: Seed the database with data, for which is resets the database and reapplies migrations to do so.
- `db:studio`: Open a UI to manage the database's data.

## Further Documentation

- [Setup your development environment](https://github.com/Kyoso-Team/kyoso/tree/master/docs/setup.md)
- [Code quality and guidelines](https://github.com/Kyoso-Team/kyoso/tree/master/docs/code.md)
- [Development workflow](https://github.com/Kyoso-Team/kyoso/tree/master/docs/workflow.md)
