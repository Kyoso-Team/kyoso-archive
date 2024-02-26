// import sharp from 'sharp';
// import db from '$db';
// import { dbTournament } from '$db/schema';
// import { eq } from 'drizzle-orm';
// import env from '$lib/server/env';
// import { t, tryCatch } from '$trpc';
// import { z } from 'zod';
// import { TRPCError } from '@trpc/server';
// import { isAllowed } from '$lib/server/utils';
// import { hasPerms, byteUnit, format } from '$lib/utils';
// import { getUser, getUserAsStaff } from '$trpc/middleware';
// import { withTournamentSchema } from '$lib/schemas';
// import { Blob } from 'buffer';
// import type { FileType } from '$types';

// const proceduresSchema = z.union([z.literal('tournamentBanner'), z.literal('tournamentLogo')]);

// const fileSchema = z.custom<File>((value) => value instanceof File);

// async function upload(folderName: string, fileName: string, file: File) {
//   let splitName = file.name.split('.');
//   let extension = splitName[splitName.length - 1];

//   await fetch(`${env.STORAGE_ENDPOINT}/${folderName}/${fileName}.${extension}`, {
//     method: 'PUT',
//     headers: {
//       'AccessKey': env.STORAGE_PASSWORD,
//       'content-type': 'application/octet-stream'
//     },
//     body: file
//   });
// }

// async function destroy(folderName: string, fileName: string) {
//   await fetch(`${env.STORAGE_ENDPOINT}/${folderName}/${fileName}`, {
//     method: 'DELETE',
//     headers: {
//       AccessKey: env.STORAGE_PASSWORD
//     }
//   });
// }

// function validateFile(
//   file: File,
//   validations: {
//     maxSize?: number;
//     types?: FileType[];
//   }
// ) {
//   if (validations.maxSize && file.size > validations.maxSize) {
//     throw new TRPCError({
//       code: 'PAYLOAD_TOO_LARGE',
//       message: `File is too big. Limit for this endpoint is of ${new Intl.NumberFormat(
//         'us-US'
//       ).format(validations.maxSize)} bytes.`
//     });
//   }

//   if (validations.types) {
//     let splitName = file.name.split('.');
//     let extension = splitName[splitName.length - 1];

//     if (!validations.types.find((type) => type === extension)) {
//       throw new TRPCError({
//         code: 'BAD_REQUEST',
//         message: `You can't upload .${extension} files to this endpoint.`
//       });
//     }
//   }
// }

// function bufferToFile(buffer: Buffer, fileName: string) {
//   return new File([new Blob([buffer]) as unknown as BlobPart], fileName, {
//     lastModified: new Date().getTime()
//   });
// }

// export const uploadRouter = t.router({
//   getUploadInfo: t.procedure.query(async ({ ctx }) => {
//     let formData = await ctx.request.formData();
//     let file = formData.get('file');
//     let input = formData.get('input') as unknown;
//     let procedure = proceduresSchema.safeParse(formData.get('procedure'));

//     if (!file || !(file instanceof File)) {
//       throw new TRPCError({
//         code: 'BAD_REQUEST',
//         message: 'Invalid file.'
//       });
//     }

//     if (!procedure.success) {
//       throw new TRPCError({
//         code: 'BAD_REQUEST',
//         message: 'Invalid procedure.'
//       });
//     }

//     try {
//       input = typeof input === 'string' && input ? JSON.parse(input) : input;
//     } catch (err) {
//       console.error(`Attempted to parse input but failed. Input received: "${input}"`);
//     }

//     return {
//       file,
//       input,
//       procedureName: procedure.data
//     };
//   }),
//   obtain: t.procedure.input(z.string()).query(async ({ input }) => {
//     let upload = await fetch(`${env.STORAGE_ENDPOINT}/${input}`, {
//       method: 'GET',
//       headers: {
//         accept: '*/*',
//         AccessKey: env.STORAGE_PASSWORD
//       }
//     });

//     if (!upload.ok) {
//       return null;
//     } else {
//       return await upload.blob();
//     }
//   }),
//   upload: t.router({
//     tournamentBanner: t.procedure
//       .use(getUser)
//       .use(getUserAsStaff)
//       .input(
//         withTournamentSchema.extend({
//           file: fileSchema
//         })
//       )
//       .mutation(async ({ ctx, input: { tournamentId, file } }) => {
//         isAllowed(
//           ctx.user.isAdmin || hasPerms(ctx.staffMember, ['mutate_tournament', 'host']),
//           `upload the banner for tournament of ID ${tournamentId}`
//         );

//         validateFile(file, {
//           maxSize: byteUnit.mb(25),
//           types: ['gif', 'jpeg', 'jpg', 'png', 'png', 'webp']
//         });

//         let buffer = await file.arrayBuffer();
//         let fileName = format.digits(tournamentId, 8);

//         let fullImgBuffer = await sharp(buffer)
//           .resize({
//             width: 1600,
//             height: 667
//           })
//           .jpeg({
//             quality: 100
//           })
//           .toBuffer();
//         let fullImg = bufferToFile(fullImgBuffer, 'full.jpeg');

//         let thumbImgBuffer = await sharp(buffer)
//           .resize({
//             width: 620,
//             height: 258
//           })
//           .jpeg({
//             quality: 100
//           })
//           .toBuffer();
//         let thumbImg = bufferToFile(thumbImgBuffer, 'thumb.jpeg');

//         await tryCatch(async () => {
//           await upload('tournament-banners', `${fileName}-full`, fullImg);
//           await upload('tournament-banners', `${fileName}-thumb`, thumbImg);

//           await db
//             .update(dbTournament)
//             .set({
//               hasBanner: true
//             })
//             .where(eq(dbTournament.id, tournamentId));
//         }, `Can't upload banner for tournament with ID ${tournamentId}.`);
//       }),
//     tournamentLogo: t.procedure
//       .use(getUser)
//       .use(getUserAsStaff)
//       .input(
//         withTournamentSchema.extend({
//           file: fileSchema
//         })
//       )
//       .mutation(async ({ ctx, input: { tournamentId, file } }) => {
//         isAllowed(
//           ctx.user.isAdmin || hasPerms(ctx.staffMember, ['mutate_tournament', 'host']),
//           `upload the logo for tournament of ID ${tournamentId}`
//         );

//         validateFile(file, {
//           maxSize: byteUnit.mb(25),
//           types: ['gif', 'jpeg', 'jpg', 'png', 'png', 'webp']
//         });

//         let buffer = await file.arrayBuffer();
//         let fileName = format.digits(tournamentId, 8);

//         let fullImgBuffer = await sharp(buffer)
//           .resize({
//             width: 800,
//             height: 800
//           })
//           .jpeg({
//             quality: 100
//           })
//           .toBuffer();
//         let fullImg = bufferToFile(fullImgBuffer, 'full.jpeg');

//         let thumbImgBuffer = await sharp(buffer)
//           .resize({
//             width: 250,
//             height: 250
//           })
//           .jpeg({
//             quality: 100
//           })
//           .toBuffer();
//         let thumbImg = bufferToFile(thumbImgBuffer, 'icon.jpeg');

//         await tryCatch(async () => {
//           await upload('tournament-logos', `${fileName}-full`, fullImg);
//           await upload('tournament-logos', `${fileName}-icon`, thumbImg);

//           await db
//             .update(dbTournament)
//             .set({
//               hasLogo: true
//             })
//             .where(eq(dbTournament.id, tournamentId));
//         }, `Can't upload logo for tournament with ID ${tournamentId}.`);
//       })
//   }),
//   delete: t.router({
//     tournamentBanner: t.procedure
//       .use(getUser)
//       .use(getUserAsStaff)
//       .input(withTournamentSchema)
//       .mutation(async ({ ctx, input: { tournamentId } }) => {
//         isAllowed(
//           ctx.user.isAdmin || hasPerms(ctx.staffMember, ['mutate_tournament', 'host']),
//           `delete the banner for tournament of ID ${tournamentId}`
//         );

//         await tryCatch(async () => {
//           await destroy('tournament-banners', `${format.digits(tournamentId, 8)}-full.jpeg`);
//           await destroy('tournament-banners', `${format.digits(tournamentId, 8)}-thumb.jpeg`);

//           await db
//             .update(dbTournament)
//             .set({
//               hasBanner: false
//             })
//             .where(eq(dbTournament.id, tournamentId));
//         }, `Can't delete banner for tournament with ID ${tournamentId}.`);
//       }),
//     tournamentLogo: t.procedure
//       .use(getUser)
//       .use(getUserAsStaff)
//       .input(withTournamentSchema)
//       .mutation(async ({ ctx, input: { tournamentId } }) => {
//         isAllowed(
//           ctx.user.isAdmin || hasPerms(ctx.staffMember, ['mutate_tournament', 'host']),
//           `delete the logo for tournament of ID ${tournamentId}`
//         );

//         await tryCatch(async () => {
//           await destroy('tournament-logos', `${format.digits(tournamentId, 8)}-full.jpeg`);
//           await destroy('tournament-logos', `${format.digits(tournamentId, 8)}-icon.jpeg`);

//           await db
//             .update(dbTournament)
//             .set({
//               hasLogo: false
//             })
//             .where(eq(dbTournament.id, tournamentId));
//         }, `Can't delete logo for tournament with ID ${tournamentId}.`);
//       })
//   })
// });
