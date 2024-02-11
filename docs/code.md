# Code Quality & Guidelines

## Linting & Formatting

Recommended to run `pnpm review` to first format, then lint the project before making a commit. Not the end of the world if you don't do so but it is recommended, especially if your code editor or IDE has very different formatting settings that the ones defined in this project.

## Component Structure

Structure to follow when writing Svelte components or pages.

```svelte
<script lang="ts">
  // Default imports
  // Destructured imports
  // Type imports

  // Type definitions

  // Props
  // Variables
  // Constants

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
    // ...
  }

  // Constants
  const someConstant = 21;
  // Props
  export let page: PageServerData;
  // Variables
  let object: Example = {
    // ...
  };

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
  .limit(30);
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
