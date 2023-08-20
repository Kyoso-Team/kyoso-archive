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

## Getting Started

Setup the environment variables by renaming the `.env.example` file to `.env` and give each variable the respective necessary value.

## Scripts

Scripts present in the package.json file. Each script must be prepended with `pnpm` or `npm run`.

- `dev`: Start SvelteKit development server.
- `build`: Build SvelteKit app.
- `Preview`: Start a server running the output of the `build` script.
- `check` & `check:watch`: Updates svelte routes with correct type definitions, either with or without watch mode.
- `lint`: Code linting.
- `fmt`: Code formatting.
- `db:generate`: Generate a new migration file. Must be used after making changes to the schema (`src/lib/db/schema` folder).
- `db:migrate`: Apply generated migrations.
- `review`: Runs `fmt`, `lint` and `check`, one after the other.

## Node Version

Currently, Kyoso is deployed on [Render](https://render.com), which comes with NodeJS v14 by default. SvelteKit requires at least Node v16 to run. Setting the `engines.node` attribute in `package.json` to `>16.x` means that you can run any Node version above 16, but upon deploying, Render will install Node v20 which SvelteKit doesn't support.

What does this mean? Well, for development, there's two solutions:

1- Changing `engines.node` to `>16.x` (or your desired version equal or above 16) and developing with that version, but not changing the version in commits.
2- Use NodeJS version 16. I recommend installing [NVM](https://github.com/nvm-sh/nvm) which can be used to switch between Node versions in case downgrading to v16 is not an option for you.

## Component Structure

Structure to follow when writing Svelte components or pages.

```svelte
<script lang="ts">
  // Default imports
  // Destructured imports
  // Type imports

  // Type definitions

  // Constants
  // Props
  // Variables

  // Lifecycle events

  // Functions

  // Reactive statements
</script>

<!-- Page content -->
```

**Example:**

```svelte
<script lang="ts">
  // Default imports
  import isEqual from 'lodash.isequal';
  // Destructured imports
  import { onMount } from 'svelte';
  // Type imports
  import type { PageServerData } from './$types';

  // Type definitions
  interface Example {
    ...
  }

  // Constants
  const someConstant = 21;
  // Props
  export let page: PageServerData;
  // Variables
  let object: Example = {
    ...
  };

  // Lifecycle events
  onMount(() => {
    ...
  });

  // Functions
  function onClick() {
    ...
  }

  // Reactive statements
  $: {
    ...
  }
</script>
```

## Database Queries

[Drizzle ORM](https://orm.drizzle.team) is a new ORM that closely resembles raw SQL, being very performant and enabling native SQL and (in this project's case) Postgres functionality.

There's only one way to insert, update and delete data, but getting data has two different approaches: core API and relational query builder (RQB) API.

In the following example, we're querying 30 users that aren't restricted, alongside each user's country data and ordered by registration date:

**Core API**

```ts
const users = await db
  .select({
    id: dbUser.id,
    osuUsername: dbUser.osuUsername,
    country: {
      name: dbCountry.name,
      code: dbCountry.code
    }
  })
  .from(dbUser)
  .where(eq(dbUser.isRestricted, false))
  .orderBy(asc(dbUser.registeredAt))
  .limit(30)
```

**RQB API**

```ts
const users = await db.query.dbUser.findMany({
  columns: {
    id: true,
    osuUsername: true
  },
  with: {
    country: {
      name: true,
      code: true
    }
  },
  where: eq(dbUser.isRestricted, false),
  orderBy: asc(dbUser.registeredAt),
  limit: 30
});
```

### When to use each

In queries that don't have joins, they're practically the same in performance, but talking about joins, the core API is faster to query. The core API also enables aliasing columns, which can be useful in certain queries. But the core API can become difficult to operate with when talking about one to many relationships, needing to map the data out once the ORM returns the query result, something that you don't need to do with RQB, as it already maps it out for you.

I (Mario564) recommend sticking to the core API most of the time, for complex joins however, feel free to use the RQB API.

## Utilities

Check out the utilities provided in `src/lib/utils.ts` and `src/lib/server-utils.ts`, something in there might already be written for something you want to achieve. If a certain task is repeated in multiple files, feel free to add and document more utilities.
