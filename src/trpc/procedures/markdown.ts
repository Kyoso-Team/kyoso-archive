// import { t } from '$trpc';
// import { z } from 'zod';
// import { sanitize } from 'isomorphic-dompurify';
// import { Converter } from 'showdown';

// export const markdownRouter = t.router({
//   sanitize: t.procedure.input(z.string()).query(async ({ input }) => {
//     const html = new Converter().makeHtml(input);
//     return sanitize(html, { USE_PROFILES: { html: true } });
//   })
// });
