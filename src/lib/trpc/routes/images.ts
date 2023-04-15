import prisma from '$prisma';
import { t, tryCatch } from '$trpc';
import { getUploadInfo, getUser } from '$trpc/middleware';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const imagesRouter = t.router({
  obtain: t.procedure.input(z.string()).query(async ({ input, ctx }) => {
    let id = input.replace(/[^0-9.]/g, "")
    if (isNaN(+id)) {
      return null
    }
    
    return await prisma.image.findFirst({
      where: {
        id: +id
      }
    })
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
        message: "Not allowed to upload for the given reason."
      })
    } else {
      return next()
    }
  })
  .mutation(async ({ ctx }) => {
    let image = await tryCatch(async () => {
      let img = ctx.uploadInfo.img
      let arrayBuffer = await img.arrayBuffer()
      let buffer = Buffer.from(arrayBuffer)

      return await prisma.image.create({
        data: {
          name: img.name,
          mime_type: img.type,
          last_modified: img.lastModified,
          size: img.size,
          data: buffer
        }
      })
    }, "Can't upload an image")

    return image
  })
})
