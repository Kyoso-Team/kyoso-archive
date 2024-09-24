import * as v from 'valibot';
import { env } from '$lib/server/env';
import { catcher, error } from '$lib/server/error';
import type { ErrorInside } from '$lib/types';

export function parseSearchParams<T extends Record<string, v.GenericSchema>>(
  inside: ErrorInside,
  url: URL,
  schemas: T
): { [K in keyof T]: v.InferOutput<T[K]> } {
  const data: Record<string, any> = {};

  for (const key in schemas) {
    const value = url.searchParams.get(key) || undefined;
    let coerced: any = value;

    if (coerced?.match(/^\d+$/)) {
      coerced = Number(coerced);
    } else if (coerced === 'true') {
      coerced = true;
    } else if (coerced === 'false') {
      coerced = false;
    }

    const parsed = v.safeParse(schemas[key], coerced);

    if (!parsed.success) {
      const issue = (v.flatten(parsed.issues).root || [])[0];
      error(inside, 'bad_request', `Invalid input: ${key} should ${issue}`);
    }

    data[key] = parsed.output;
  }

  return data as any;
}

export async function parseRequestBody<T extends v.GenericSchema>(
  inside: ErrorInside,
  request: Request,
  schema: T
): Promise<v.InferOutput<T>> {
  const body: Record<string, any> = await request
    .json()
    .catch(catcher(inside, "Body is malformed or isn't JSON"));
  const parsed = v.safeParse(schema, body);

  if (!parsed.success) {
    let str = 'Invalid input:\n';
    const issues = v.flatten(parsed.issues).nested;

    for (const key in issues) {
      str += `- body.${key} should ${issues[key]}\n`;
    }

    str = str.trimEnd();
    error(inside, 'bad_request', str);
  }

  return parsed.output as any;
}

export async function parseFormData<T extends Record<string, v.GenericSchema>>(
  inside: ErrorInside,
  request: Request,
  schemas: T
): Promise<{ [K in keyof T]: v.InferOutput<T[K]> }> {
  const fd = await request
    .formData()
    .catch(catcher(inside, "Body is malformed or isn't form data"));
  const data: Record<string, any> = {};

  for (const key in schemas) {
    const value = fd.get(key);
    const parsed = v.safeParse(schemas[key], !isNaN(Number(value)) ? Number(value) : value);

    if (!parsed.success) {
      const issue = (v.flatten(parsed.issues).root || [])[0];
      error(inside, 'bad_request', `Invalid input: ${key} should ${issue}`);
    }

    data[key] = parsed.output;
  }

  return data as any;
}

export function validateCronSecret(inside: ErrorInside, request: Request) {
  const header = request.headers.get('authorization');

  if (!header) {
    error(inside, 'bad_request', 'Authorization header is undefined');
  }

  const authorization = header.split(' ');

  if (authorization[0] !== 'Cron' || authorization[1] !== env.CRON_SECRET) {
    error(inside, 'bad_request', 'Invalid authorization header');
  }

  return 'success';
}
