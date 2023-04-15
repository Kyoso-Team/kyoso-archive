import { t } from '$trpc';
import { getUploadInfo, getUser } from '$trpc/middleware';
import { z } from 'zod';
import env from '$lib/env/server';

export const uploadRouter = t.router({
  obtain: t.procedure.input(z.string()).query(async ({ input, ctx }) => {
    let upload = await fetch(`${env.STORAGE_ENDPOINT}/${input}`, {
      method: 'GET',
      headers: {
        accept: '*/*',
        AccessKey: env.STORAGE_PASSWORD
      }
    });

    if (!upload.ok) {
      return null;
    } else {
      return await upload.blob();
    }
  }),

  upload: t.procedure
    .use(getUser)
    .use(getUploadInfo)
    .use(({ ctx, next }) => {
      let allowed = false;
      let info = ctx.uploadInfo;

      if (ctx.user.isAdmin) {
        allowed = true;
      } else {
        if (info.targetType === 'tournament') {
          let staffMember = ctx.user.asStaffMember.find(
            (staffed) => staffed.tournamentId === info.targetId
          );

          if (info.uploadType === 'tournamentLogo') {
            if (
              staffMember &&
              staffMember.roles.find((role) =>
                role.permissions.find((permission) => permission === 'MutateTournament')
              )
            ) {
              allowed = true;
            }
          }
        }
      }

      return next({
        ctx: {
          allowed
        }
      });
    })
    .mutation(async ({ ctx }) => {
      if (!ctx.allowed) {
        return false;
      }
      let info = ctx.uploadInfo;

      /**
       * File name is the `targetId` + an appropriate extension
       * The extension does not relate to what the file actually is,
       * rather what it's supposed to be according to `uploadType`
       * (at least, until implementation of file type checking)
       */
      let extension = info.uploadType !== 'replay' ? '.jpg' : '.osr';
      let name = `${info.targetId}${extension}`;

      let upload = await fetch(`${env.STORAGE_ENDPOINT}/${info.uploadType}/${name}`, {
        method: 'PUT',
        headers: {
          'AccessKey': env.STORAGE_PASSWORD,
          'content-type': 'application/octet-stream'
        },
        body: info.upload
      });

      if (!upload.ok) {
        return null;
      } else {
        return {
          url: `/uploads/${info.uploadType}/${name}`,
          file: info.upload
        };
      }
    })
});
