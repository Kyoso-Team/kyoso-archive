// import { getCaller } from '$trpc/caller';
// import { error } from '@sveltejs/kit';
// import { TRPCError } from '@trpc/server';
// import type { RequestHandler } from './$types';

// export const POST = (async (event) => {
//   try {
//     const caller = await getCaller(event);
//     let { file, procedureName, input } = await caller.uploads.getUploadInfo();

//     // We do a little bit of trolling with the type system
//     let procedure = (caller.uploads.upload as Record<string, (input: unknown) => Promise<void>>)[
//       procedureName
//     ];

//     await procedure({
//       ...(typeof input === 'object' ? input : {}),
//       file
//     });
//   } catch (err) {
//     if (err instanceof TRPCError && err.code === 'PAYLOAD_TOO_LARGE') {
//       return new Response(err.message);
//     }

//     throw error(500, err as TRPCError);
//   }

//   return new Response('Upload successful.');
// }) satisfies RequestHandler;
