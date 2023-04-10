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

   return next({
      ctx: {
        allowed
      }
    })
  })
  .mutation(async ({ ctx }) => {
    if (!ctx.allowed) {return false}
    let info = ctx.uploadInfo
    let upload = await fetch(`${env.STORAGE_ENDPOINT}/${env.STORAGE_ZONE}/${info.uploadType}_${info.targetId}/${info.upload.name}`, {
      method: "PUT",
      headers: {
        AccessKey: env.STORAGE_PASSWORD,
        "content-type": "application/octet-stream",
      },
      body: info.upload
    })

    if (!upload.ok) {
      return null
    } else {
      removeOldFiles(`${env.STORAGE_ENDPOINT}/${env.STORAGE_ZONE}/${info.uploadType}_${info.targetId}/`, info.upload.name)
      return {
        url: `/uploads/${info.uploadType}_${info.targetId}/${info.upload.name}`,
        file: info.upload
      }
    }
  })
})

/**
 * When a user uploads a file, it may render some previously uploaded file outdated or meaningless
 * To not store files for no reason, we delete those files!
 * It is done through that function for syncronisation reasons
 * (there's no need to wait for the removal to be done to send back the file info to the uploader)
 */
async function removeOldFiles(fetchUrl: string, newerFileName: string) {
  let list_response = await fetch(fetchUrl, {
    method: "GET",
    headers: {
      accept: "application/json",
      AccessKey: env.STORAGE_PASSWORD
    }
  })
  let list = await list_response.json()

  for (let i = 0; i < list.length; i++) {
    if (list[i]["ObjectName"] !== newerFileName) {
      let deletion = await fetch(`${fetchUrl}${list[i]["ObjectName"]}`, {
        method: "DELETE",
        headers: {
          AccessKey: env.STORAGE_PASSWORD
        }
      })
      
      if (!deletion.ok) {
        console.error("Failed to delete a file from storage", deletion)
      }
    }
  }
}
