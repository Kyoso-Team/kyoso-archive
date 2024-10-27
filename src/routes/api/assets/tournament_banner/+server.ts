import { eq } from 'drizzle-orm';
import { Tournament } from '$db';
import { checks } from '$lib/server/checks';
import { getSession, getStaffMember } from '$lib/server/context';
import { transformFile } from '$lib/server/files';
import { parseFormData } from '$lib/server/request';
import { db, s3 } from '$lib/server/services';
import { convertBytes } from '$lib/utils';
import { fileSchema, positiveIntSchema } from '$lib/validation';
import type { Assets } from '$lib/types';
import type { RequestHandler } from './$types';
import { getBuckets, getTournamentBannerFileNames } from '$lib/server/storage';
import { catcher } from '$lib/server/error';

export const PUT = (async ({ cookies, request }) => {
  const session = getSession('api', cookies, true);
  const data: Assets['tournamentBanner']['put'] = await parseFormData('api', request, {
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

  const names = getTournamentBannerFileNames(data.tournamentId);
  const files = await transformFile({
    inside: 'api',
    file: data.file,
    validations: {
      maxSize: convertBytes.mb(25),
      types: ['jpeg', 'jpg', 'png', 'webp']
    },
    resizes: [
      {
        name: names.full,
        width: 1600,
        height: 685,
        quality: 100
      },
      {
        name: names.thumb,
        width: 620,
        height: 266,
        quality: 75
      }
    ]
  });

  const buckets = await getBuckets('api');
  await Promise.all([
    files.map(
      async (file) => s3.putObject({
        Bucket: buckets.public,
        Key: file.meta.name,
        Body: file.buffer,
        ContentType: file.meta.type
      })
    )
  ]).catch(catcher('api', 'Uploading the files'));

  await db
    .update(Tournament)
    .set({
      bannerMetadata: {
        originalFileName: data.file.name
      }
    })
    .where(eq(Tournament.id, data.tournamentId)).catch(catcher('api', 'Updating the tournament'));

  return new Response('Success');
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies, request }) => {
  const session = getSession('api', cookies, true);
  const data: Assets['tournamentBanner']['delete'] = await parseFormData('api', request, {
    tournamentId: positiveIntSchema
  });
  const staffMember = await getStaffMember('api', session, data.tournamentId, true);
  checks.api.staffHasPermissions(staffMember, [
    'host',
    'debug',
    'manage_tournament',
    'manage_assets'
  ]);

  const names = getTournamentBannerFileNames(data.tournamentId);
  const buckets = await getBuckets('api');

  await db
    .update(Tournament)
    .set({
      bannerMetadata: null
    })
    .where(eq(Tournament.id, data.tournamentId))
    .catch(catcher('api', 'Updating the tournament'));

  await Promise.all(
    Object.values(names).map(
      (fileName) => s3.deleteObject({
        Bucket: buckets.public,
        Key: fileName
      })
    )
  );

  return new Response('Success');
}) satisfies RequestHandler;
