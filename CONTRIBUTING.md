# Contribution Guide

Interesting in helping out in the development of Kyoso? Read this guide before doing anything, as it is very important.

## Tech Stack

If you're interested in making a signficant contribution, it's recommended that you know some of these techonologies.

**General Tools**

- [Bun](https://bun.sh): Package manager, runtime for CI and test runner.
- [SvelteKit](https://kit.svelte.dev): Full-stack framework
- [Valibot](https://valibot.dev): Validation library

**Frontend**

- [Taiwind](https://tailwindcss.com): Styling
- [Skeleton](https://www.skeleton.dev): UI library

**Backend**

- [Drizzle](https://orm.drizzle.team): ORM for the database
- [PostgreSQL](https://www.postgresql.org): The database itself
- [tRPC](https://trpc.io): Backend / API (in most cases)

**OAuth Providers**

- [osu!](https://osu.ppy.sh/home): Main provider. Required for osu! user data.
- [Discord](https://discord.com): Required for Discord user data.

**Production Tools**

- [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces): File storage
- [Upstash](https://upstash.com): Redis instance
- [Vercel](https://vercel.com): Website deployments
- [Neon](https://neon.tech): Database deployments
- [IPInfo](https://ipinfo.io): Get data from IP addresses.

## Scripts

Scripts present in the package.json file. Each script must be prepended with `bun run`.

**Basic**

- `dev`: Starts the development server.
- `build`: Builds the website.
- `preview`: Starts a server running the output of the `build` script.
- `check:watch` & `check`: Updates SvelteKit's type definitions and verifies if the app can be compiled. With or without watch mode respectively.

**Code Quality**

- `lint`: Lints the code.
- `fmt`: Fromats the code.
- `review`: Runs `format`, `lint` and `check`, one after the other.

**Database**

- `db:generate`: Generate a new migration file. Must be used after you're done making changes to the Drizzle schema.
- `db:generate-custom`: Generate a new blank migration file to write your own migration logic.
- `db:migrate`: Apply generated migrations.
- `db:reset`: Resets the database schema (deletes all rows, drops all tables, views, functions, triggers, etc.)
- `db:seed`: Seeds the database, for which it resets the database and reapplies migrations before doing so. **Currently broken, do not use**.
- `db:studio`: Opens Drizzle Kit Studio, a UI to explore your database.

## Development Environment Setup

### Requisites

- Node.js v18 or greater installed.
- Bun latest version installed.
- Docker latest version.
- An osu! account with an OAuth app.
- A Discord account with an OAuth app.

### Setup

```bash
# Clone the repository
git clone https://github.com/Kyoso-Team/kyoso.git
# Change directory
cd kyoso
# Install dependencies
bun install
# Run Docker containers
docker-compose -p kyoso-dev up --detach # You can also use the Docker Desktop GUI
# Run dev server
bun dev
```

### Environemt Variables

View the `.env.example` file to see how to setup the necessary environment variables.

## Code Quality

### Component Structure

Structure to follow when writing Svelte components.

```svelte
<script lang="ts">
  // Default imports
  // Destructured imports
  // Type imports

  // Type definitions

  // Props
  // Variables
  // Constants

  // Lifecycle events (onMount & onDestroy)

  // Functions

  // Reactive statements
</script>

<!-- Page content -->
```

**Example:**

```svelte
<script lang="ts">
  // Default imports
  import env from '$lib/env';
  // Destructured imports
  import { onMount } from 'svelte';
  // Type imports
  import type { PageServerData } from './$types';

  // Type definitions
  interface Example {
    // ...
  }

  // Props
  export let page: PageServerData;
  // Variables
  let object: Example = {
    // ...
  };
  // Constants
  const someConstant = 21;

  // Lifecycle events
  onMount(() => {
    // ...
  });

  // Functions
  function onClick() {
    // ...
  }

  // Reactive statements
  $: {
    // ...
  }
</script>

<main>Page content</main>
```

### Database Queries

Drizzle ORM has two APIs for querying data: core and RQB. When developing for this project, we only use the core API to avoid having confusion as to when to use which. The RQB is also a high-level abstraction, so it can have its limitations, bugs and performance issues compared to core.

## Pull Request Requirements

Make sure you do follow these guidelines when submitting a pull request:

- Run `bun review` to first format, then lint the project.
- Any pull request must point to the `dev` branch.
