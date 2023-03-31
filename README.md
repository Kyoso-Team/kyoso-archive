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

## Getting Started

Setup the environment variables by renaming the `.env.example` file to `.env` and give each variable the respective necessary value.

To apply migrations to the database, do `pnpm db:push`, then run `pnpm dev` to start the development server.
