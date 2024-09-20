import { wrap } from '@typeschema/valibot';
import { and, asc, eq, isNull, notExists, or, sql } from 'drizzle-orm';
import * as v from 'valibot';
import { Ban, OsuUser, Tournament, User } from '$db';
import { getSession } from '$lib/server/context';
import { setSimilarityThreshold } from '$lib/server/queries';
import { db, trpc } from '$lib/server/services';
import { isNullOrFuture, trgmSearch } from '$lib/server/sql';
import { pick, trpcUnknownError } from '$lib/server/utils';
import type { SQL } from 'drizzle-orm';

const search = trpc.procedure
  .input(wrap(v.string([v.minLength(1)])))
  .query(async ({ ctx, input }) => {
    getSession('trpc', ctx.cookies, true);

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
              and(isNull(Ban.revokedAt), isNullOrFuture(Ban.liftAt))
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
        .where(and(isNullOrFuture(Tournament.deletedAt), or(...tournamentWhereCondition)))
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

export const rootProcedures = {
  search
};
