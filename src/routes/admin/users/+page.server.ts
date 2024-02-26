import { Ban, DiscordUser, OsuUser, User, db } from '$db';
import { asc, count, countDistinct, eq, sql } from 'drizzle-orm';
import { apiError, pick } from '$lib/server/utils';
import { unionAll } from 'drizzle-orm/pg-core';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, route }) => {
  await parent();
  
  const userCountQuery = db
    .select({
      count: count(User.id).as('count'),
      order: sql`1`.as('order')
    })
    .from(User);

  const adminCountQuery = db
    .select({
      count: count(User.id).as('count'),
      order: sql`2`.as('order')
    })
    .from(User)
    .where(eq(User.admin, true));

  const hostCountQuery = db
    .select({
      count: count(User.id).as('count'),
      order: sql`3`.as('order')
    })
    .from(User)
    .where(eq(User.approvedHost, true));

  const bannedCountQuery = db
    .select({
      count: countDistinct(Ban.issuedToUserId).as('count'),
      order: sql`4`.as('order')
    })
    .from(User)
    .leftJoin(Ban, eq(Ban.issuedToUserId, User.id));

  let counts!: {
    total: number;
    admin: number;
    host: number;
    banned: number;
  };

  try {
    counts = await unionAll(
      userCountQuery,
      adminCountQuery,
      hostCountQuery,
      bannedCountQuery
    ).then((rows) => ({
      total: rows[0].count,
      admin: rows[1].count,
      host: rows[2].count,
      banned: rows[3].count
    }));
  } catch (err) {
    throw await apiError(err, 'Getting the amount of users', route);
  }

  const selectFields = {
    ...pick(User, ['id', 'admin', 'approvedHost']),
    osu: pick(OsuUser, ['osuUserId', 'username']),
    discord: pick(DiscordUser, ['discordUserId', 'username'])
  };

  const getAdminsQuery = db
    .select({
      ...selectFields,
      banned: sql<boolean>`false`.as('banned')
    })
    .from(User)
    .innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId))
    .innerJoin(DiscordUser, eq(DiscordUser.discordUserId, User.discordUserId))
    .where(eq(User.admin, true))
    .orderBy(asc(OsuUser.username));
    
  const getHostsQuery = db
    .select({
      ...selectFields,
      banned: sql<boolean>`false`.as('banned')
    })
    .from(User)
    .innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId))
    .innerJoin(DiscordUser, eq(DiscordUser.discordUserId, User.discordUserId))
    .where(eq(User.approvedHost, true))
    .orderBy(asc(OsuUser.username));

  const getBannedQuery = db
    .selectDistinct({
      ...selectFields,
      banned: sql<boolean>`true`.as('banned')
    })
    .from(User)
    .innerJoin(OsuUser, eq(OsuUser.osuUserId, User.osuUserId))
    .innerJoin(DiscordUser, eq(DiscordUser.discordUserId, User.discordUserId))
    .innerJoin(Ban, eq(Ban.issuedToUserId, User.id))
    .orderBy(asc(OsuUser.username));

  let users!: (Pick<typeof User.$inferSelect, 'id' | 'admin' | 'approvedHost'> & {
    banned: boolean;
    osu: Pick<typeof OsuUser.$inferSelect, 'osuUserId' | 'username'>;
    discord: Pick<typeof DiscordUser.$inferSelect, 'discordUserId' | 'username'>;
  })[];

  try {
    users = await unionAll(
      getAdminsQuery,
      getHostsQuery,
      getBannedQuery
    );
  } catch (err) {
    throw await apiError(err, 'Getting the users', route);
  }

  const admins = users.filter(({ admin }) => admin);
  const hosts = users.filter(({ approvedHost }) => approvedHost);
  const banned = users.filter(({ banned }) => banned);

  return {
    counts,
    users: {
      admins,
      hosts,
      banned
    }
  };
}) satisfies PageServerLoad;
