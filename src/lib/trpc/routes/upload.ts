import { t } from '$trpc';
import { getUploadInfo, getUser } from '$trpc/middleware';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import env from '$lib/env/server';

export const uploadRouter = t.router({
  obtain: t.procedure.input(z.string()).query(async ({ input, ctx }) => {
    let upload = await fetch(`${env.STORAGE_ENDPOINT}/${env.STORAGE_ZONE}/${input}`, {
      method: "GET",
      headers: {
        accept: "*/*",
        AccessKey: env.STORAGE_PASSWORD
      }
    })

    if (!upload.ok) {
      return null
    } else {
      return await upload.blob()
    }
  }),

  
  upload: t.procedure
  .use(getUser)
  .use(getUploadInfo)
  .use(({ ctx, next }) => {
    let allowed = false
    let info = ctx.uploadInfo

    if (ctx.user.isAdmin) {
      allowed = true
    }

    if (info.targetType === "tournament") {
      let staffMember = ctx.user.asStaffMember.find((x) => x.tournamentId === info.targetId)

      if (info.uploadType === "tournamentLogo") {
        if (staffMember && staffMember.roles.find((r) => r.permissions.find((p) => p === "MutateTournament"))) {
          allowed = true
        }
      }
    }

    /**
     * With how things are currently, if you're not allowed to upload,
     * you get an ugly 500 internal error, might wanna change that somehow
    */
    if (!allowed) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not allowed to upload for the given reason"
      })
    } else {
      return next()
    }
  })
  .mutation(async ({ ctx }) => {
    let info = ctx.uploadInfo
    let upload = await fetch(`${env.STORAGE_ENDPOINT}/${env.STORAGE_ZONE}/${info.uploadType}_${info.targetId}/${info.upload.name}`, {
      method: "PUT",
      headers: {
        AccessKey: env.STORAGE_PASSWORD,
        "content-type": "application/octet-stream",
      },
      body: ctx.uploadInfo.upload
    })

    if (!upload.ok) {
      return null
    } else {
      return {
        url: `/uploads/${info.uploadType}_${info.targetId}/${info.upload.name}`,
        file: ctx.uploadInfo.upload
      }
    }
  })
})
