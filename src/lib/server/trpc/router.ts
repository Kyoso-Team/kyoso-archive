import * as v from 'valibot';
import { t } from '$trpc';
import { notificationsRouter, tournamentsRouter, usersRouter } from '../procedures';
import { wrap } from '@typeschema/valibot';
import { getSession } from '$lib/server/helpers/api';
import { Ban, db, OsuUser, Tournament, User } from '$db';
import { and, asc, eq, ilike, isNull, notExists, or, sql } from 'drizzle-orm';
import { future, pick, trpcUnknownError } from '$lib/server/utils';

const search = t.procedure.input(wrap(v.string())).query(async ({ ctx, input }) => {
  getSession(ctx.cookies, true);

  let users:
    | (Pick<typeof User.$inferSelect, 'id' | 'osuUserId'> & {
        username: string;
      })[]
    | undefined;

  try {
    const isBanned = db.$with('is_banned').as(
      db
        .select()
        .from(Ban)
        .where(
          notExists(
            sql`select 1
                from ${Ban}
                where ${and(
                  eq(Ban.issuedToUserId, +input),
                  and(isNull(Ban.revokedAt), or(isNull(Ban.liftAt), future(Ban.liftAt)))
                )}
                limit 1
            `
          )
        )
    );

    users = await db
      .with(isBanned)
      .select({
        ...pick(User, ['id', 'osuUserId']),
        username: OsuUser.username
      })
      .from(User)
      .innerJoin(OsuUser, eq(User.osuUserId, OsuUser.osuUserId))
      .where(
        or(
          eq(User.id, +input),
          eq(User.osuUserId, +input),
          eq(User.discordUserId, input),
          ilike(OsuUser.username, `%${input}%`)
        )
      )
      .orderBy(({ username }) => asc(username))
      .limit(10);
  } catch (err) {
    throw trpcUnknownError(err, 'Expiring the session');
  }

  let tournaments:
    | Pick<
        typeof Tournament.$inferSelect,
        'name' | 'urlSlug' | 'acronym' | 'logoMetadata' | 'bannerMetadata'
      >[]
    | undefined;

  try {
    tournaments = await db
      .select({
        ...pick(Tournament, ['name', 'urlSlug', 'acronym', 'logoMetadata', 'bannerMetadata'])
      })
      .from(Tournament)
      .where(
        or(
          eq(Tournament.id, +input),
          ilike(Tournament.name, `%${input}%`),
          ilike(Tournament.acronym, `%${input}%`),
          ilike(Tournament.urlSlug, `%${input}%`),
          eq(Tournament.deleted, false)
        )
      )
      .orderBy(({ name }) => asc(name))
      .limit(10);
  } catch (err) {
    throw trpcUnknownError(err, 'Expiring the session');
  }

  return {
    users,
    tournaments
  };
});

export const router = t.router({
  search,
  users: usersRouter,
  tournaments: tournamentsRouter,
  notifications: notificationsRouter
});

export type Router = typeof router;
