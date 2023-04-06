import prisma from '$prisma';
import { t, tryCatch } from '$trpc';
import { getUser } from '$trpc/middleware';
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

  
  upload: t.procedure.use(getUser).input(z.object({
    file: z.custom<File>((v) => v instanceof File),
    procedure: z.string(),
    targetType: z.string(),
    targetId: z.number()
  })).query(async ({ input, ctx }) => {

    /**
     * Is the user allowed to upload `file` using `procedure` to change
     * something related to team or tournament (`targetType`) with id `targetId`?
     * (procedure might be something like, "banner")
     * Note: A middleware can't be used as input is needed to figure out what's to be done
     */

    let image = await tryCatch(async () => {
      let allowed = false
      
      if (input.targetType === "tournament") {
        if (input.procedure === "banner") {
          let staffMember = ctx.user.asStaffMember.find((x) => x.tournamentId === input.targetId)
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
        throw new TRPCError({message: "Not allowed", code: "UNAUTHORIZED"})
      }

      let file = input.file
      let arrayBuffer = await file.arrayBuffer()
      let buffer = Buffer.from(arrayBuffer)

      return await prisma.image.create({
        data: {
          name: file.name,
          mime_type: file.type,
          last_modified: file.lastModified,
          size: file.size,
          data: buffer
        }
      })
    }, "Can't upload an image")

    return image
  })
})
