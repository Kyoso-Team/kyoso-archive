import './polyfill';
import { resetDatabase } from '$lib/server/helpers/queries';

async function main() {
  await resetDatabase();
  console.log('Reset database successfully');
}

main().then(() => process.exit(0));
