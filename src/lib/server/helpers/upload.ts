import * as v from 'valibot';
import sharp from 'sharp';
import env from '$lib/server/env';
import { apiError } from '$lib/server/utils';
import { error } from '@sveltejs/kit';
import { fileSchema } from '$lib/schemas';
import type { FileType, Simplify } from '$types';

export async function parseFormData<T extends Record<string, v.BaseSchema>>(request: Request, route: { id: string | null }, schemas: T): Promise<Simplify<{
  file: File;
} & { [K in keyof T]: v.Output<T[K]> }>> {
  let fd!: FormData;

  try {
    fd = await request.formData();
  } catch (err) {
    error(400, 'Body is malformed or isn\'t form data');
  }

  const data: Record<string, any> = {};
  
  try {
    const file = v.parse(fileSchema, fd.get('file'));
    data.file = file;

    for (const key in schemas) {
      data[key] = v.parse(schemas[key], fd.get(key));
    }
  } catch (err) {
    if (err instanceof v.ValiError) {
      let str = 'Invalid input:\n';
      const issues = v.flatten(err.issues).nested;


      for (const key in issues) {
        str += `- body.${key} should ${issues[key]}\n`;
      }

      str = str.trimEnd();
      error(400, str);
    } else {
      throw await apiError(err, 'Parsing the form data', route);
    }
  }

  return data as any;
}

export async function transformFile(config: {
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
  const { file, validations, resizes } = config;

  if (validations?.maxSize && config.file.size > validations.maxSize) {
    const bytes = new Intl.NumberFormat('us-US').format(validations.maxSize);
    error(413, `File is too large. Size limit is of ${bytes} bytes`);
  }

  if (validations?.types) {
    const splitName = file.name.split('.');
    const extension = splitName[splitName.length - 1];

    if (!validations.types.find((type) => type === extension)) {
      error(400, `You can't upload .${extension} files`);
    }
  }

  if (!resizes) return [];

  return await Promise.all(
    resizes.map(async ({ width, height, quality, name }) => {
      const buffer = await file.arrayBuffer();
      const newBuffer = await sharp(buffer)
        .resize({ width, height })
        .jpeg({ quality })
        .toBuffer();

      const newFile = new File([new Blob([newBuffer]) as any], name, {
        lastModified: new Date().getTime()
      });

      return newFile;
    })
  );
}

export async function uploadFile(route: { id: string | null }, folderName: string, file: File) {
  try {
    await fetch(`https://${env.BUNNY_HOSTNAME}/${env.BUNNY_USERNAME}/${folderName}/${file.name}`, {
      method: 'PUT',
      headers: {
        'AccessKey': env.BUNNY_PASSWORD,
        'content-type': 'application/octet-stream'
      },
      body: file
    });
  } catch (err) {
    throw await apiError(err, 'Uploading the file', route);
  }
}

export async function deleteFile(route: { id: string | null }, folderName: string, fileName: string) {
  try {
    await fetch(`https://${env.BUNNY_HOSTNAME}/${env.BUNNY_USERNAME}/${folderName}/${fileName}`, {
      method: 'DELETE',
      headers: {
        AccessKey: env.BUNNY_PASSWORD
      }
    });
  } catch (err) {
    throw await apiError(err, 'Deleting the file', route);
  }
}

export async function getFile(route: { id: string | null }, folderName: string, fileName: string) {
  let resp!: Response;

  try {
    resp = await fetch(`https://${env.BUNNY_HOSTNAME}/${env.BUNNY_USERNAME}/${folderName}/${fileName}`, {
      headers: {
        accept: '*/*',
        AccessKey: env.BUNNY_PASSWORD
      }
    });
  } catch (err) {
    throw await apiError(err, 'Getting the file', route);
  }

  if (resp.status === 404) {
    error(404, 'File not found');
  }

  if (!resp.ok) {
    const baseMsg = 'Unexpected response from Bunny.net';
    console.log(`${baseMsg}: ${await resp.text()}`);
    error(resp.status as any, baseMsg);
  }

  return await resp.blob();
}
