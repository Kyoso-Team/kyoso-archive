import env from '$lib/env/server';
import { tryCatch } from '$trpc';
import { Client } from 'osu-web.js';
import { findFirst, findFirstOrThrow, select } from '$lib/server-utils';
import { dbBeatmap, dbModpool, dbStarRating, dbBeatmapset, dbMapper } from '$db/schema';
import { eq, and, SQL } from 'drizzle-orm';
import type dbInstance from '$db';
import type { Mod } from 'osu-web.js';
import type { User as DiscordUser } from 'discord-oauth2';
import type { PgColumn, PgTableWithColumns } from 'drizzle-orm/pg-core';

export async function getOrCreateMap(
  db: typeof dbInstance,
  osuAccessToken: string,
  osuBeatmapId: number,
  modpoolId: number
) {
  let osuApi = new Client(osuAccessToken);

  let beatmap = findFirst(
    await db
      .select(select(dbBeatmap, [
        'osuBeatmapId'
      ]))
      .from(dbBeatmap)
      .where(eq(dbBeatmap.osuBeatmapId, osuBeatmapId))
  );

  let modpool = findFirstOrThrow(
    await db
      .select(select(dbModpool, [
        'mods'
      ]))
      .from(dbModpool)
      .where(eq(dbModpool.id, modpoolId)),
    'modpool'
  );

  let starRating: {
    id: number;
  } | null = null;

  if (beatmap) {
    starRating = findFirst(
      await db
        .select(select(dbStarRating, [
          'id'
        ]))
        .from(dbStarRating)
        .where(and(
          eq(dbStarRating.mods, modpool.mods),
          eq(dbStarRating.beatmapId, beatmap.osuBeatmapId)
        ))
    ) || null;
  }

  if (!beatmap) {
    let data = await osuApi.beatmaps.getBeatmap(osuBeatmapId);

    await tryCatch(async () => {
      await db.transaction(async (tx) => {
        let mapper = findFirstOrThrow(
          await tx
            .insert(dbMapper)
            .values({
              osuUserId: data.user_id,
              username: data.beatmapset.creator
            })
            .onConflictDoUpdate({
              target: dbMapper.osuUserId,
              set: {
                username: data.beatmapset.creator
              }
            })
            .returning(select(dbMapper, [
              'osuUserId'
            ])),
          'mapper'
        );

        let selectBeatmapset = select(dbBeatmapset, [
          'osuBeatmapsetId'
        ]);

        let mapset = findFirst(
          await tx
            .insert(dbBeatmapset)
            .values({
              osuBeatmapsetId: data.beatmapset_id,
              artist: data.beatmapset.artist,
              title: data.beatmapset.title,
              mapperId: mapper.osuUserId
            })
            .onConflictDoNothing({
              target: dbBeatmapset.osuBeatmapsetId
            })
            .returning(selectBeatmapset)
        );

        if (!mapset) {
          mapset = findFirstOrThrow(
            await tx
              .select(selectBeatmapset)
              .from(dbBeatmapset)
              .where(eq(dbBeatmapset.osuBeatmapsetId, data.beatmapset_id)),
            'beatmapset'
          );
        }

        beatmap = findFirstOrThrow(
          await tx
            .insert(dbBeatmap)
            .values({
              osuBeatmapId: data.id,
              diffName: data.version,
              maxCombo: data.max_combo,
              bpm: data.bpm || 0,
              length: data.total_length,
              cs: data.cs,
              ar: data.ar,
              od: data.accuracy,
              hp: data.drain,
              beatmapsetId: mapset.osuBeatmapsetId
            })
            .returning(select(dbBeatmap, [
              'osuBeatmapId'
            ])),
          'beatmap'
        );
      });
    }, "Can't create beatmap for suggestion.");
  }

  if (!starRating) {
    let data = await osuApi.beatmaps.getBeatmapAttributes(osuBeatmapId, 'osu', {
      body: {
        mods: modpool.mods.map((mod) => mod.toUpperCase()) as Mod[]
      }
    });

    await tryCatch(async () => {
      if (beatmap) {
        await db
          .insert(dbStarRating)
          .values({
            value: data.star_rating,
            beatmapId: beatmap.osuBeatmapId,
            mods: modpool.mods
          });
      } else {
        throw new Error('Somehow about to create a star rating without creating the beatmap');
      }
    }, "Can't create beatmap star rating for suggestion.");
  }

  if (!beatmap) {
    throw new Error('"beatmap" is null or undefined');
  }

  return beatmap;
}

export async function getDiscordUser(discordUserId: string) {
  let resp = await fetch(`https://discord.com/api/users/${discordUserId}`, {
    headers: {
      Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`
    }
  });
  let user = await resp.json();

  return user as DiscordUser;
}

export async function swapOrder<T extends PgTableWithColumns<{
  name: string;
  dialect: 'pg';
  schema: undefined;
  columns: C;
}>, C extends {
  id: PgColumn<{
    name: 'id';
    tableName: string;
    dataType: 'number';
    columnType: 'PgSerial';
    data: number;
    driverParam: number;
    enumValues: undefined;
    hasDefault: boolean;
    notNull: boolean;
  }>;
  order: PgColumn<{
    name: 'order';
    tableName: string;
    dataType: 'number';
    columnType: 'PgSmallInt';
    data: number;
    driverParam: string | number;
    enumValues: undefined;
    hasDefault: boolean;
    notNull: boolean;
  }>;
}>(
  db: typeof dbInstance,
  table: T,
  value1: {
    id: number;
    order: number;
  },
  value2: typeof value1
) {
  await db.transaction(async (tx) => {
    await tx
      .update(table)
      .set({
        order: value2.order as unknown as SQL
      })
      .where(eq(table.id, value1.id));

    await tx
      .update(table)
      .set({
        order: value1.order as unknown as SQL
      })
      .where(eq(table.id, value2.id));
  });
}