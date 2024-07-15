import {
  Country,
  db,
  DiscordUser,
  OsuBadge,
  OsuUser,
  OsuUserAwardedBadge,
  Session,
  User
} from '$db';
import { count, sql } from 'drizzle-orm';
import { pick } from '$lib/server/utils';
import type { AuthSession } from '$types';
import type { AnyPgTable } from 'drizzle-orm/pg-core';

/** https://www.postgresql.org/docs/current/sql-truncate.html */
export async function truncateTables(tables: AnyPgTable | AnyPgTable[]) {
  const truncate = Array.isArray(tables)
    ? sql.join(
        tables.map((table) => table),
        sql`, `
      )
    : tables;
  await db.execute(sql`truncate ${truncate} restart identity cascade`);
}

export async function createMockUser(user?: {
  admin?: boolean;
  approvedHost?: boolean;
  osu?: {
    /** Automatically generated if undefined */
    id?: number;
    globalStdRank?: number;
    globalTaikoRank?: number;
    globalCatchRank?: number;
    globalManiaRank?: number;
    /** Defaults to false if undefined */
    restricted?: boolean;
    /** Defaults to United States if undefined */
    country?: { code: string; name: string };
    badgeCount?: number;
  };
  discord?: {
    /** Automatically generated if undefined */
    id?: string;
  };
}): Promise<Readonly<AuthSession>> {
  const osuUserId: number =
    user?.osu?.id ??
    (await db
      .select({ count: count().as('count') })
      .from(OsuUser)
      .then(([{ count }]) => count + 1));
  const osuUsername = `osu-${osuUserId}`;

  const discordUserId: string =
    user?.discord?.id ??
    (await db
      .select({ count: count().as('count') })
      .from(DiscordUser)
      .then(([{ count }]) => (count + 1).toString()));
  const discordUsername = `discord-${discordUserId}`;

  return await db.transaction(async (tx) => {
    await tx
      .insert(Country)
      .values(
        user?.osu?.country
          ? {
              code: user.osu.country.code,
              name: user.osu.country.name
            }
          : {
              code: 'US',
              name: 'United States'
            }
      )
      .onConflictDoNothing({
        target: [Country.code]
      });

    await db.insert(OsuUser).values({
      osuUserId,
      countryCode: user?.osu?.country?.code ?? 'US',
      restricted: user?.osu?.restricted ?? false,
      username: osuUsername,
      globalStdRank: user?.osu?.globalStdRank ?? null,
      globalTaikoRank: user?.osu?.globalTaikoRank ?? null,
      globalCatchRank: user?.osu?.globalCatchRank ?? null,
      globalManiaRank: user?.osu?.globalManiaRank ?? null,
      token: {
        accesstoken: 'xxx',
        refreshToken: 'xxx',
        tokenIssuedAt: new Date().getTime()
      }
    });

    if (user?.osu?.badgeCount) {
      const badges = Array.from({ length: user.osu.badgeCount }).map(() => {
        const n = Math.random();
        return {
          imgFileName: `badge-${n}.png`,
          description: `Badge ${n}`
        };
      });

      const createdBadges = await tx
        .insert(OsuBadge)
        .values(badges)
        .returning(pick(OsuBadge, ['id']));

      const awardedBadges: (typeof OsuUserAwardedBadge.$inferInsert)[] = createdBadges.map(
        (badge) => ({
          osuUserId,
          osuBadgeId: badge.id,
          awardedAt: new Date()
        })
      );

      await tx
        .insert(OsuUserAwardedBadge)
        .values(awardedBadges)
        .onConflictDoNothing({
          target: [OsuUserAwardedBadge.osuBadgeId, OsuUserAwardedBadge.osuUserId]
        });
    }

    await db.insert(DiscordUser).values({
      discordUserId,
      username: discordUsername,
      token: {
        accesstoken: 'xxx',
        refreshToken: 'xxx',
        tokenIssuedAt: new Date().getTime()
      }
    });

    const createdUser = await db
      .insert(User)
      .values({
        discordUserId,
        osuUserId,
        admin: user?.admin,
        approvedHost: user?.approvedHost
      })
      .returning(pick(User, ['id', 'admin', 'approvedHost']))
      .then((user) => user[0]);

    const session = await db
      .insert(Session)
      .values({
        userId: createdUser.id,
        ipAddress: '127.0.0.1',
        userAgent: 'User Agent',
        ipMetadata: {
          city: 'Some city',
          region: 'Some region',
          country: 'Some country'
        }
      })
      .returning(pick(Session, ['id']))
      .then((session) => session[0]);

    return Object.freeze({
      admin: createdUser.admin,
      approvedHost: createdUser.approvedHost,
      userId: createdUser.id,
      sessionId: session.id,
      updatedApiDataAt: new Date().getTime(),
      discord: {
        id: discordUserId,
        username: discordUsername
      },
      osu: {
        id: osuUserId,
        username: osuUsername
      }
    });
  });
}
