import { Client } from 'osu-web.js';
import { tryCatch } from '$trpc';
import type { PrismaClient } from '@prisma/client';

export async function getOrCreateMap(prisma: PrismaClient, currentUserId: number, osuBeatmapId: number, modpoolId: number) {
  let { osuAccessToken } = await prisma.user.findUniqueOrThrow({
    where: {
      id: currentUserId
    },
    select: {
      osuAccessToken: true
    }
  });
  let osuApi = new Client(osuAccessToken);

  let beatmapPromise = prisma.beatmap.findUnique({
    where: {
      osuBeatmapId
    },
    select: {
      osuBeatmapId: true
    }
  });
  let modpoolPromise = prisma.modpool.findUniqueOrThrow({
    where: {
      id: modpoolId
    },
    select: {
      mods: true
    }
  });

  let [beatmap, modpool] = await Promise.all([beatmapPromise, modpoolPromise]);

  let starRating = beatmap ? await prisma.starRating.findUnique({
    where: {
      mods_beatmapId: {
        mods: modpool.mods,
        beatmapId: beatmap.osuBeatmapId
      }
    },
    select: {
      id: true
    }
  }) : null;

  if (!beatmap) {
    let data = await osuApi.beatmaps.getBeatmap(osuBeatmapId);

    await tryCatch(async () => {
      await prisma.$transaction(async (tx) => {
        let mapper = await tx.mapper.upsert({
          create: {
            osuUserId: data.user_id,
            username: data.beatmapset.creator
          },
          update: {
            username: data.beatmapset.creator
          },
          where: {
            osuUserId: data.user_id
          },
          select: {
            osuUserId: true
          }
        });

        let mapset = await tx.beatmapset.upsert({
          create: {
            osuBeatmapsetId: data.beatmapset_id,
            artist: data.beatmapset.artist,
            title: data.beatmapset.title,
            mapperId: mapper.osuUserId
          },
          update: {},
          where: {
            osuBeatmapsetId: data.beatmapset_id
          },
          select: {
            osuBeatmapsetId: true
          }
        });

        beatmap = await tx.beatmap.create({
          data: {
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
          },
          select: {
            osuBeatmapId: true
          }
        });
      })
    }, "Can't create beatmap for suggestion."); 
  }

  if (!starRating) {
    let data = await osuApi.beatmaps.getBeatmapAttributes(osuBeatmapId, 'osu', {
      body: {
        mods: modpool.mods
      }
    });

    await tryCatch(async () => {
      if (beatmap) {
        await prisma.starRating.create({
          data: {
            value: data.star_rating,
            beatmapId: beatmap.osuBeatmapId,
            mods: modpool.mods
          }
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