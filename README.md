# Kyoso

Repository for the Kyoso website.

## Stack

- [pnpm](https://pnpm.io): Package manager
- [SvelteKit](https://kit.svelte.dev): Full-stack framework
- [Zod](https://zod.dev): Validation library
- [Prisma](https://www.prisma.io): ORM for the database
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
- `db:push`: Push Prisma schema to the database and generate the client for it.
- `db:studio`: Opens UI to view and manage the database's data.
- `review`: Runs `fmt`, `lint` and `check`, one after the other.

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
