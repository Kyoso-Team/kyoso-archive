import * as v from 'valibot';
import { t } from '$trpc';
import { wrap } from '@typeschema/valibot';
import { getSession } from '$lib/server/helpers/trpc';
import { Ban, db, OsuUser, Tournament, User } from '$db';
import { and, asc, eq, isNull, notExists, or, sql } from 'drizzle-orm';
import { future, pick, trgmSearch, trpcUnknownError } from '$lib/server/utils';
import { setSimilarityThreshold } from '../helpers/queries';
import {
  formsRouter,
  notificationsRouter,
  staffRolesRouter,
  tournamentsRouter,
  usersRouter
} from '../procedures';
import type { SQL } from 'drizzle-orm';

const search = t.procedure.input(wrap(v.string([v.minLength(1)]))).query(async ({ ctx, input }) => {
  getSession(ctx.cookies, true);

  try {
    await setSimilarityThreshold();
  } catch (err) {
    throw trpcUnknownError(err, 'Setting the similarity threshold for pg_trgm');
  }

  let users:
    | (Pick<typeof User.$inferSelect, 'id' | 'osuUserId'> & {
        username: string;
      })[]
    | undefined;

  const isBanned = db.$with('is_banned').as(
    db
      .select()
      .from(Ban)
      .where(
        sql`select 1
            from ${Ban}
            where ${and(
              eq(Ban.issuedToUserId, +input),
              and(isNull(Ban.revokedAt), or(isNull(Ban.liftAt), future(Ban.liftAt)))
            )}
            limit 1
        `
      )
  );

  const userWhereCondition: SQL[] = [
    eq(User.discordUserId, input),
    trgmSearch(input, [OsuUser.username])
  ];

  if (!isNaN(parseInt(input))) {
    userWhereCondition.push(eq(User.id, +input), eq(User.osuUserId, +input));
  }

  try {
    users = await db
      .with(isBanned)
      .select({
        ...pick(User, ['id', 'osuUserId']),
        username: OsuUser.username
      })
      .from(User)
      .innerJoin(OsuUser, eq(User.osuUserId, OsuUser.osuUserId))
      .where(and(notExists(isBanned), or(...userWhereCondition)))
      .orderBy(asc(OsuUser.username))
      .limit(10);
  } catch (err) {
    throw trpcUnknownError(err, 'Searching for users');
  }

  let tournaments:
    | Pick<
        typeof Tournament.$inferSelect,
        'name' | 'urlSlug' | 'acronym' | 'logoMetadata' | 'bannerMetadata'
      >[]
    | undefined;

  const tournamentWhereCondition: SQL[] = [
    trgmSearch(input, [Tournament.name, Tournament.acronym])
  ];

  if (!isNaN(parseInt(input))) {
    tournamentWhereCondition.push(eq(Tournament.id, +input));
  }

  try {
    tournaments = await db
      .select({
        ...pick(Tournament, ['name', 'urlSlug', 'acronym', 'logoMetadata', 'bannerMetadata'])
      })
      .from(Tournament)
      .where(
        and(
          or(isNull(Tournament.deletedAt), future(Tournament.deletedAt)),
          or(...tournamentWhereCondition)
        )
      )
      .orderBy(asc(Tournament.name))
      .limit(10);
  } catch (err) {
    throw trpcUnknownError(err, 'Searching for tournaments');
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
  notifications: notificationsRouter,
  staffRoles: staffRolesRouter,
  forms: formsRouter
});

export type Router = typeof router;
