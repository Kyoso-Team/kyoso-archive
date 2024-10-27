import type { ErrorInside } from '$lib/types';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { catcher } from './error';
import { redis, s3 } from './services';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { formatDigits } from '$lib/format';

export async function getBuckets(inside: ErrorInside, options?: { dontCreate: boolean }) {
  const bucketNames = ['public'] as const;
  const bucketsObj = bucketNames.reduce((obj, bucket) => ({ ...obj, [bucket]: bucket }), {}) as Record<typeof bucketNames[number], typeof bucketNames[number]>;

  if (options?.dontCreate) {
    return bucketsObj;
  }

  const buckets = await s3.listBuckets().then((resp) => resp.Buckets ?? []);

  if (!buckets.find((bucket) => bucket.Name === 'public')) {
    await s3.createBucket({
      Bucket: 'public',
      ACL: 'public-read'
    }).catch(catcher(inside, 'Creating the bucket'));
  }

  return bucketsObj;
}

export async function getImageUrl(inside: ErrorInside, bucket: string, key: string) {
  const cachedUrl = await redis.get<string>(`${bucket}:${key}`);
  
  if (cachedUrl) {
    return cachedUrl;
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 43_200 }).catch(catcher(inside, 'Getting signed URL for the file'));
  await redis.set(`${bucket}:${key}`, url, {
    ex: 43_200
  });

  return url;
}

export function getTournamentLogoFileNames(tournamentId: number) {
  return {
    full: `tournament-logo-${formatDigits(tournamentId, 9)}-full.jpeg`,
    sm: `tournament-logo-${formatDigits(tournamentId, 9)}-sm.jpeg`
  };
}

export function getTournamentBannerFileNames(tournamentId: number) {
  return {
    full: `tournament-banner-${formatDigits(tournamentId, 9)}-full.jpeg`,
    thumb: `tournament-banner-${formatDigits(tournamentId, 9)}-thumb.jpeg`
  };
}
