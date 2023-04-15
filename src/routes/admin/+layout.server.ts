import { error } from '@sveltejs/kit';

export const load = async (event) => {
  let parent = await event.parent();
  if (!parent.user?.isAdmin) {
    throw error(401, "You're not allowed here!");
  }
};
