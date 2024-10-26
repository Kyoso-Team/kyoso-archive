import { error } from '@sveltejs/kit';
import { and, eq, isNotNull, isNull, or } from 'drizzle-orm';
import * as v from 'valibot';
import { Tournament, TournamentDates } from '$db';
import { formatDigits } from '$lib/format';
import { checks } from '$lib/server/checks';
import { getSession, getStaffMember } from '$lib/server/context';
import { transformFile } from '$lib/server/files';
import { parseFormData, parseSearchParams } from '$lib/server/request';
import { db } from '$lib/server/services';
import { future, past } from '$lib/server/sql';
import { apiError, generateFileId, pick } from '$lib/server/utils';
import { convertBytes } from '$lib/utils';
import { boolStringSchema, fileIdSchema, fileSchema, positiveIntSchema } from '$lib/validation';
import type { Assets } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, cookies, route, setHeaders }) => {
  const params = await parseSearchParams('api', url, {
    tournament_id: positiveIntSchema,
    file_id: fileIdSchema,
    public: v.optional(boolStringSchema),
    size: v.union([v.literal('full'), v.literal('sm')], 'be "full" or "sm"')
  });

  setHeaders({
    'cache-control': 'max-age=604800'
  });

  const session = getSession('api', cookies, true);
  await getStaffMember('api', session, params.tournament_id, !params.public);

  let fileId: string | undefined;

  try {
    fileId = await db
      .select(pick(Tournament, ['logoMetadata']))
      .from(Tournament)
      .where(
        and(
          eq(Tournament.id, params.tournament_id),
          or(isNull(Tournament.deletedAt), future(Tournament.deletedAt)),
          params.public ? isNotNull(TournamentDates.publishedAt) : undefined,
          params.public ? past(TournamentDates.publishedAt) : undefined
        )
      )
      .leftJoin(TournamentDates, eq(TournamentDates.tournamentId, Tournament.id))
      .limit(1)
      .then((rows) => rows[0].logoMetadata?.fileId);
  } catch (err) {
    throw await apiError(err, 'Getting the tournament', route);
  }

  if (!fileId) {
    error(404, "Either this tournament doesn't exist or it doesn't have a logo");
  }

  if (fileId !== params.file_id) {
    error(400, 'Incorrect file ID');
  }

  let file!: Blob;

  try {
    // file = await getFile(
    //   route,
    //   'tournament-logos',
    //   `${formatDigits(params.tournament_id, 9)}-${params.size || 'sm'}.jpeg`
    // );
  } catch (err) {
    throw await apiError(err, 'Getting the file', route);
  }

  return new Response(file);
}) satisfies RequestHandler;

export const PUT = (async ({ cookies, route, request }) => {
  const session = getSession('api', cookies, true);
  const data: Assets['tournamentLogo']['put'] = await parseFormData('api', request, {
    file: fileSchema,
    tournamentId: positiveIntSchema
  });
  const staffMember = await getStaffMember('api', session, data.tournamentId, true);
  checks.api.staffHasPermissions(staffMember, [
    'host',
    'debug',
    'manage_tournament',
    'manage_assets'
  ]);

  const fileId = generateFileId();
  const names = {
    full: `${formatDigits(data.tournamentId, 9)}-full.jpeg`,
    sm: `${formatDigits(data.tournamentId, 9)}-sm.jpeg`
  };

  const _files = await transformFile({
    inside: 'api',
    file: data.file,
    validations: {
      maxSize: convertBytes.mb(25),
      types: ['jpeg', 'jpg', 'png', 'webp']
    },
    resizes: [
      {
        name: names.full,
        width: 250,
        height: 250,
        quality: 100
      },
      {
        name: names.sm,
        width: 75,
        height: 75,
        quality: 75
      }
    ]
  });

  try {
    //await Promise.all(files.map((file) => uploadFile(route, 'tournament-logos', file)));
  } catch (err) {
    throw await apiError(err, 'Uploading the files', route);
  }

  try {
    await db
      .update(Tournament)
      .set({
        logoMetadata: {
          originalFileName: data.file.name,
          fileId
        }
      })
      .where(eq(Tournament.id, data.tournamentId));
  } catch (err) {
    throw await apiError(err, 'Updating the tournament', route);
  }

  return new Response(fileId);
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies, route, request }) => {
  const session = getSession('api', cookies, true);
  const data: Assets['tournamentLogo']['delete'] = await parseFormData('api', request, {
    tournamentId: positiveIntSchema
  });
  const staffMember = await getStaffMember('api', session, data.tournamentId, true);
  checks.api.staffHasPermissions(staffMember, [
    'host',
    'debug',
    'manage_tournament',
    'manage_assets'
  ]);

  const _names = {
    full: `${formatDigits(data.tournamentId, 9)}-full.jpeg`,
    sm: `${formatDigits(data.tournamentId, 9)}-sm.jpeg`
  };

  try {
    await db
      .update(Tournament)
      .set({
        logoMetadata: null
      })
      .where(eq(Tournament.id, data.tournamentId));
  } catch (err) {
    throw await apiError(err, 'Updating the tournament', route);
  }

  try {
    // await Promise.all(
    //   Object.values(names).map((fileName) => deleteFile(route, 'tournament-logos', fileName))
    // );
  } catch (err) {
    throw await apiError(err, 'Deleting the files', route);
  }

  return new Response('Success');
}) satisfies RequestHandler;
