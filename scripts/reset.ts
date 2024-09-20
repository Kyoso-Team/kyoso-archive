import { resetDatabase } from '$lib/server/queries';

await resetDatabase();

console.log('Reset database successfully');
process.exit(0);
