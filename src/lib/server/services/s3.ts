import { S3 } from '@aws-sdk/client-s3';
import { env } from '$lib/server/env';

export const s3 = new S3({
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY
  }
});
