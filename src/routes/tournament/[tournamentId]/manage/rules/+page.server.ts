import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  let { rules } = await prisma.tournament.findUniqueOrThrow({
    where: {
      id: data.tournament.id
    },
    select: {
      rules: true
    }
  });

  return {
    id: data.tournament.id,
    rules
  };
}) satisfies PageServerLoad;
