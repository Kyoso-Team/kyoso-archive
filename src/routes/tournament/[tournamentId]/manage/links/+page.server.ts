import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let data = await parent();

  let tournament = await prisma.tournament.findUniqueOrThrow({
    where: {
      id: data.tournament.id
    },
    select: {
      forumPostId: true,
      discordInviteId: true,
      mainSheetId: true,
      twitchChannelName: true,
      youtubeChannelId: true,
      donationLink: true,
      websiteLink: true,
      twitterHandle: true
    }
  });

  return {
    id: data.tournament.id,
    ...tournament
  };
}) satisfies PageServerLoad;
