import prisma from '$prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
  let { tournamentId } = await parent();

  let tournament = await prisma.tournament.findUnique({
    where: {
      id: tournamentId
    },
    select: {
      forumPostId: true,
      discordInviteId: true,
      mainSheetId: true,
      twitchChannelName: true,
      youtubeChannelId: true,
      donationLink: true,
      websiteLink: true
    }
  });

  return {
    id: tournamentId,
    ...tournament
  };
}) satisfies PageServerLoad;
