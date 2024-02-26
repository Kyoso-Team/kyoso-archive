import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { generateFileId, getSession, past, pick, sveltekitError } from '$lib/server-utils';
import { Tournament, db } from '$db';
import { and, eq, isNotNull, not, sql } from 'drizzle-orm';
import { boolStringSchema, fileIdSchema, positiveIntSchema } from '$lib/schemas';
import { deleteFile, getFile, getStaffMember, parseSearchParams, parseUploadFormData, transformFile, uploadFile } from '$lib/server/helpers';
import { convertBytes, formatDigits, hasPermissions } from '$lib/utils';
import type { RequestHandler } from './$types';

export const GET = (async ({ url, cookies, route, setHeaders }) => {
  const params = await parseSearchParams(url, route, {
    tournament_id: positiveIntSchema,
    file_id: fileIdSchema,
    public: v.optional(boolStringSchema),
    size: v.union(
      [v.literal('full'), v.literal('thumb')],
      'be "full" or "thumb"'
    )
  });

  setHeaders({
    'cache-control': 'max-age=604800'
  });

  const session = getSession(cookies, params.public);
  const staffMember = await getStaffMember(route, session, params.tournament_id);

  if (!params.public && !staffMember) {
    error(401, 'You do not have the required permissions to view this tournament\'s banner');
  }

  let fileId: string | undefined;

  try {
    fileId = await db
      .select(pick(Tournament, ['bannerMetadata']))
      .from(Tournament)
      .where(and(
        eq(Tournament.id, params.tournament_id),
        not(Tournament.deleted),
        params.public ? isNotNull(sql`(${Tournament.dates} -> 'publish')::bigint`) : undefined,
        params.public ? past(sql`(${Tournament.dates} -> 'publish')::bigint`, true) : undefined
      ))
      .limit(1)
      .then((rows) => rows[0].bannerMetadata?.fileId);
  } catch (err) {
    throw await sveltekitError(err, 'Updating the tournament', route);
  }

  if (!fileId) {
    error(404, 'Either this tournament doesn\'t exist or it doesn\'t have a banner');
  }

  if (fileId !== params.file_id) {
    error(400, 'Incorrect file ID');
  }

  const file = await getFile(route, 'tournament-banners', `${formatDigits(params.tournament_id, 9)}-${params.size || 'thumb'}.jpeg`);
  return new Response(file);
}) satisfies RequestHandler;

export const PUT = (async ({ cookies, route, request }) => {
  const session = getSession(cookies, true);
  const data = await parseUploadFormData(request, route, {
    tournamentId: positiveIntSchema
  });
  const staffMember = await getStaffMember(route, session, data.tournamentId);

  if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament_settings', 'manage_tournament_assets'])) {
    error(401, 'You do not have the required permissions to upload this tournament\'s banner');
  }

  const fileId = generateFileId();
  const names = {
    full: `${formatDigits(data.tournamentId, 9)}-full.jpeg`,
    thumb: `${formatDigits(data.tournamentId, 9)}-thumb.jpeg`
  };

  const files = await transformFile({
    file: data.file,
    validations: {
      maxSize: convertBytes.mb(25),
      types: ['jpeg', 'jpg', 'png', 'webp']
    },
    resizes: [{
      name: names.full,
      width: 1600,
      height: 667,
      quality: 100
    }, {
      name: names.thumb,
      width: 620,
      height: 258,
      quality: 75
    }]
  });

  await Promise.all(files.map((file) => uploadFile(route, 'tournament-banners', file)));

  try {
    await db
      .update(Tournament)
      .set({
        bannerMetadata: {
          fileId
        }
      })
      .where(eq(Tournament.id, data.tournamentId));
  } catch (err) {
    throw await sveltekitError(err, 'Updating the tournament', route);
  }

  return new Response(fileId);
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies, route, request }) => {
  const session = getSession(cookies, true);
  const data = await parseUploadFormData(request, route, {
    tournamentId: positiveIntSchema
  });
  const staffMember = await getStaffMember(route, session, data.tournamentId);

  if (!hasPermissions(staffMember, ['host', 'debug', 'manage_tournament_settings', 'manage_tournament_assets'])) {
    error(401, 'You do not have the required permissions to delete this tournament\'s banner');
  }

  const names = {
    full: `${formatDigits(data.tournamentId, 9)}-full.jpeg`,
    thumb: `${formatDigits(data.tournamentId, 9)}-thumb.jpeg`
  };

  try {
    await db
      .update(Tournament)
      .set({
        bannerMetadata: null
      })
      .where(eq(Tournament.id, data.tournamentId));
  } catch (err) {
    throw await sveltekitError(err, 'Updating the tournament', route);
  }

  await Promise.all(Object.values(names).map((fileName) => deleteFile(route, 'tournament-banners', fileName)));
  return new Response('Success');
}) satisfies RequestHandler;
