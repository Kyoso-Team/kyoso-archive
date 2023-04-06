import { getCaller } from '$trpc/caller';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (async (event) => {
  const caller = await getCaller(event)
  const form = await event.request.formData()

  const img = form.get("file") as File
  const procedure = form.get("procedure")
  const targetType = form.get("targetType")
  const targetId = form.get("targetId") as string

  if (!procedure || !procedure.length) {
    throw error(400, "No procedure has been specified...")
  }
  if (!targetType || !targetType.length) {
    throw error(400, "No target type has been specified...")
  }
  if (isNaN(+targetId)) {
    throw error(400, "No valid ID has been specified...")
  }

  /**
   * Currently, authorizationstuff is expected to be done through
   * the caller (imagesRouter), with the information such as
   * the procedure and the id of what's to be modified
   */

  let upload = await caller.images.upload({
    file: img,
    procedure: procedure as string,
    targetType: targetType as string,
    targetId: +targetId
  })
  throw redirect(302, `/images/${upload.id}`)
}) satisfies RequestHandler;
