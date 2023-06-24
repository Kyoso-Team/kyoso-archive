import prisma from '$prisma';
import { z } from 'zod';
import { redirect, error } from '@sveltejs/kit';
import { buildLink } from '$lib/utils';
import type { RequestHandler } from './$types';

export const GET = (async ({ params, url }) => {
  let tournamentId = z.number().int().parse(Number(params.tournamentId));
  let linkTo = z.string().parse(params.link);

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
      twitterHandle: true,
      donationLink: true,
      websiteLink: true
    }
  });

  if (!tournament) {
    throw error(404, `Couldn't find tournament with ID ${tournamentId}.`);
  }

  let link: string | null = null;

  if (linkTo === 'forum' && tournament.forumPostId) {
    link = buildLink.forumPost(tournament.forumPostId);
  }

  if (linkTo === 'discord' && tournament.discordInviteId) {
    link = buildLink.discord(tournament.discordInviteId);
  }

  if (linkTo === 'main-sheet' && tournament.mainSheetId) {
    link = buildLink.spreadsheet(tournament.mainSheetId);
  }

  if (linkTo === 'twitch' && tournament.twitchChannelName) {
    link = buildLink.twitch(tournament.twitchChannelName);
  }

  if (linkTo === 'youtube' && tournament.youtubeChannelId) {
    link = buildLink.youtube(tournament.youtubeChannelId);
  }

  if (linkTo === 'twitter' && tournament.twitterHandle) {
    link = buildLink.twitter(tournament.twitterHandle);
  }

  // Prevent these links to reference this endpoint (avoiding self-referencing)
  if ([tournament.donationLink, tournament.websiteLink].find((link) => !!link && link !== url.href)) {
    link = (tournament.donationLink) ? tournament.donationLink : tournament.websiteLink;
  }

  if (!link) {
    throw error(404, `Couldn't find the requested link for tournament with ID ${tournamentId}.`);
  }

  throw redirect(302, link);
}) satisfies RequestHandler;
