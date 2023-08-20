import db from '$db';
import { dbTournament } from '$db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { redirect, error } from '@sveltejs/kit';
import { buildLink } from '$lib/utils';
import { findFirst } from '$lib/server-utils';
import type { RequestHandler } from './$types';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

function getLink(linkTo: string) {
  let noLink = false;
  let builder: ((value: string) => string) | undefined;
  let column: AnyPgColumn = dbTournament.id;

  switch(linkTo) {
    case 'forum':
      builder = (forumPostId: string) => buildLink.forumPost(Number(forumPostId));
      column = dbTournament.forumPostId;
      break;
    case 'discord':
      builder = buildLink.discord;
      column = dbTournament.discordInviteId;
      break;
    case 'main-sheet':
      builder = buildLink.spreadsheet;
      column = dbTournament.mainSheetId;
      break;
    case 'twitch':
      builder = buildLink.twitch;
      column = dbTournament.twitchChannelName;
      break;
    case 'youtube':
      builder = buildLink.youtube;
      column = dbTournament.youtubeChannelId;
      break;
    case 'twitter':
      builder = buildLink.twitter;
      column = dbTournament.twitterHandle;
      break;
    case 'website':
      column = dbTournament.websiteLink;
      break;
    case 'donate':
      column = dbTournament.donationLink;
      break;
    default:
      noLink = true;
      break;
  }

  return noLink ? undefined : { builder, column };
}

export const GET = (async ({ params, url }) => {
  let tournamentId = z.number().int().parse(Number(params.tournamentId));
  let linkTo = z.string().parse(params.link);
  let link = getLink(linkTo);

  if (!link) {
    throw error(404, `Couldn't find the requested link for tournament with ID ${tournamentId}.`);
  }

  let tournament = findFirst(
    await db
      .select({
        link: sql<string>`${link.column}::text`
      })
      .from(dbTournament)
      .where(eq(dbTournament.id, tournamentId))
  );

  if (!tournament) {
    throw error(404, `Couldn't find tournament with ID ${tournamentId}.`);
  }

  let fullLink = link.builder ? link.builder(tournament.link) : tournament.link;
  let supportedUrls = [
    'forum',
    'discord',
    'main-sheet',
    'twitch',
    'youtube',
    'twitter',
    'website',
    'donate'
  ].map((endpoint) => `${url.host}/tournament/${tournamentId}/${endpoint}`);

  // Prevent these links to reference this endpoint (avoiding self-referencing)
  if (supportedUrls.some((url) => fullLink.includes(url))) {
    throw error(404, 'Links referencing this endpoint are not allowed.');
  }

  throw redirect(302, fullLink);
}) satisfies RequestHandler;
