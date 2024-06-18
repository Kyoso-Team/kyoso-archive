
import type { RequestHandler } from './$types';

interface Font {
  id: string;
  family: string;
  subsets: string[];
  weights: number[];
  styles: string[];
  defSubset: string;
  variable: boolean;
  lastModified: string;
  category: string;
  license: string;
  type: string;
}

export const GET = (async ({ setHeaders }) => {
  const resp = await fetch('https://api.fontsource.org/v1/fonts?weights=400,500,700&type=google&category=display,sans-serif&subsets=latin-ext');
  let fonts = await resp.json() as Font[];
  
  fonts = fonts.filter((({ weights }) => {
    return weights.includes(400) && weights.includes(500) && weights.includes(700);
  }));
  const mapped = Object.fromEntries(fonts.map(({ id, family }) => [id, family]));

  return new Response(JSON.stringify(mapped));
}) satisfies RequestHandler;
