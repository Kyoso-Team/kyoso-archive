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
      osuUsername: prismaSortSchema
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
      country: true
    },
    orderBy: {
      osuUsername: sort.osuUsername || 'desc'
    }
  });
  let userCount = prisma.user.count({ where });

  return {
    users,
    userCount,
    page
  };
}) satisfies PageServerLoad;
