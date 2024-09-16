import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { generateFileId, past, pick, apiError, future } from '$lib/server/utils';
import { db } from '$lib/server/services';
import { Tournament, TournamentDates } from '$db';
import { and, eq, isNotNull, isNull, or } from 'drizzle-orm';
import { boolStringSchema, fileIdSchema, fileSchema, positiveIntSchema } from '$lib/schemas';
import {
  deleteFile,
  getFile,
  parseFormData,
  transformFile,
  uploadFile
} from '$lib/server/file';
import { getSession, getStaffMember, parseSearchParams } from '$lib/server/helpers/api';
import { convertBytes, formatDigits, hasPermissions } from '$lib/utils';
import type { RequestHandler } from './$types';
import type { Assets } from '$types';

export const GET = (async ({ url, cookies, route, setHeaders }) => {
  const params = await parseSearchParams(
    url,
    {
      tournament_id: positiveIntSchema,
      file_id: fileIdSchema,
      public: v.optional(boolStringSchema),
      size: v.union([v.literal('full'), v.literal('sm')], 'be "full" or "sm"')
    },
    route
  );

  setHeaders({
    'cache-control': 'max-age=604800'
  });

  const session = getSession(cookies);
  await getStaffMember(session, params.tournament_id, route, !params.public);

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
    file = await getFile(
      route,
      'tournament-logos',
      `${formatDigits(params.tournament_id, 9)}-${params.size || 'sm'}.jpeg`
    );
  } catch (err) {
    throw await apiError(err, 'Getting the file', route);
  }

  return new Response(file);
}) satisfies RequestHandler;

export const PUT = (async ({ cookies, route, request }) => {
  const session = getSession(cookies, true);
  const data: Assets['tournamentLogo']['put'] = await parseFormData(request, route, {
    file: fileSchema,
    tournamentId: positiveIntSchema
  });
  const staffMember = await getStaffMember(session, data.tournamentId, route, true);

  if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament', 'manage_assets'])) {
    error(401, "You do not have the required permissions to upload this tournament's logo");
  }

  const fileId = generateFileId();
  const names = {
    full: `${formatDigits(data.tournamentId, 9)}-full.jpeg`,
    sm: `${formatDigits(data.tournamentId, 9)}-sm.jpeg`
  };

  const files = await transformFile({
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
    await Promise.all(files.map((file) => uploadFile(route, 'tournament-logos', file)));
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
  const session = getSession(cookies, true);
  const data: Assets['tournamentLogo']['delete'] = await parseFormData(request, route, {
    tournamentId: positiveIntSchema
  });
  const staffMember = await getStaffMember(session, data.tournamentId, route, true);

  if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament', 'manage_assets'])) {
    error(401, "You do not have the required permissions to delete this tournament's logo");
  }

  const names = {
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
    await Promise.all(
      Object.values(names).map((fileName) => deleteFile(route, 'tournament-logos', fileName))
    );
  } catch (err) {
    throw await apiError(err, 'Deleting the files', route);
  }

  return new Response('Success');
}) satisfies RequestHandler;
