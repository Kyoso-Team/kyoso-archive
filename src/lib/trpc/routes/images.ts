import prisma from '$prisma';
import { t, tryCatch } from '$trpc';
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

	upload: t.procedure.input(z.custom<File>((v) => v instanceof File)).query(async ({ input, ctx }) => {
		let arrayBuffer = await input.arrayBuffer()
		let buffer = Buffer.from(arrayBuffer)

		let image = await tryCatch(async () => {
			return await prisma.image.create({
				data: {
					name: input.name,
					mime_type: input.type,
					last_modified: input.lastModified,
					size: input.size,
					data: buffer
				}
			})
		}, "Can't upload an image")

		return image
	})
})
