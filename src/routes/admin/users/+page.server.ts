import prisma from '$prisma';
import { z } from 'zod';
import { getUrlParams, paginate } from '$lib/server-utils';
import { prismaSortSchema } from '$lib/schemas';
import type { PageServerLoad } from './$types';
import type { Prisma } from '@prisma/client';

export const load = (async ({ parent, url }) => {
  await parent();
  let { sort, page, search } = getUrlParams(
    url,
    z.object({}),
    z.object({
      registeredAt: prismaSortSchema
    })
  );

  let containsSearch: Prisma.StringFilter = {
    contains: search,
    mode: 'insensitive'
  };

  let where: Prisma.UserWhereInput = {
    OR: [
      {
        osuUsername: containsSearch
      },
      {
        discordUsername: containsSearch
      },
      {
        osuUserId: (!isNaN(search as unknown as number)) ? Number(search) : undefined
      },
      {
        discordUserId: search
      }
    ]
  };

  let users = prisma.user.findMany({
    ...paginate(page),
    where,
    select: {
      id: true,
      isAdmin: true,
      isRestricted: true,
      osuUsername: true,
      osuUserId: true,
      discordUsername: true,
      discordDiscriminator: true,
      showDiscordTag: true,
      country: {
        select: {
          name: true,
          code: true
        }
      }
    },
    orderBy: {
      registeredAt: sort.registeredAt || 'desc'
    }
  });
  let userCount = prisma.user.count({ where });

  return {
    users,
    userCount,
    page
  };
}) satisfies PageServerLoad;
