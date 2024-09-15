import postgres from 'postgres';
import { isOsuJSError } from 'osu-web.js';

export async function logError(err: unknown, when: string, from: string | null) {
  let message = 'Unknown error';
  let osuJSResp: Response | undefined;
  let query: string | undefined;
  let queryParams: any[] | undefined;

  if (isOsuJSError(err)) {
    message = err.message;

    if (err.type === 'unexpected_response') {
      osuJSResp = err.response();
    }
  } else if (err instanceof postgres.PostgresError) {
    message = err.message;
    query = err.query;
    queryParams = err.parameters;
  }

  message = `${message}. Error thrown when: ${when}`;
  console.error(`${new Date().toUTCString()} - ${from} - ${message}`);

  if (message.includes('Unknown error')) {
    console.log(err);
  }

  if (osuJSResp) {
    const data = await osuJSResp.text();
    console.log(`${osuJSResp.status} response from osu.js: ${data}`);
  }

  if (query && queryParams) {
    console.log(`Database query: ${query}`);
    console.log(`Query parameters: ${JSON.stringify(queryParams)}`);
  }
}
