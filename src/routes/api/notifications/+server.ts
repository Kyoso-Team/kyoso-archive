import postgres from 'postgres';
import { dbClient  } from '$db';
import { getSession } from '$lib/server/helpers/api';
import type { RequestHandler } from './$types';

export const GET = (async ({ cookies }) => {
  const session = getSession(cookies, true);
  let listener!: postgres.ListenMeta;

  const stream = new ReadableStream({
    start: async (controller) => {
      listener = await dbClient.listen('new_notification', (notification) => {
        console.log(notification);
        controller.enqueue(`data: ${notification}\n\n`);
      });
    },
    cancel: () => {
      listener.unlisten();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}) satisfies RequestHandler;