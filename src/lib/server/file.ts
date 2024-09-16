import sharp from 'sharp';
import { error } from '$lib/server/error';
import type { FileType, ErrorInside } from '$types';

export async function transformFile(config: {
  inside: ErrorInside;
  file: File;
  validations?: {
    maxSize?: number;
    types?: FileType[];
  };
  resizes?: {
    name: string;
    width: number;
    height: number;
    quality: number;
  }[];
}) {
  const { inside, file, validations, resizes } = config;

  if (validations?.maxSize && config.file.size > validations.maxSize) {
    const bytes = new Intl.NumberFormat('us-US').format(validations.maxSize);
    error(inside, 'payload_too_large', `File is too large. Limit is of ${bytes} bytes`);
  }

  if (validations?.types) {
    const splitName = file.name.split('.');
    const extension = splitName[splitName.length - 1];

    if (!validations.types.find((type) => type === extension)) {
      error(inside, 'bad_request', `Can't upload .${extension} files`);
    }
  }

  if (!resizes) return [];

  return await Promise.all(
    resizes.map(async ({ width, height, quality, name }) => {
      const buffer = await file.arrayBuffer();
      const newBuffer = await sharp(buffer).resize({ width, height }).webp({ quality }).toBuffer();

      const newFile = new File([new Blob([newBuffer]) as any], name, {
        lastModified: new Date().getTime()
      });

      return newFile;
    })
  );
}
