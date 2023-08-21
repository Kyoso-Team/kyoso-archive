import * as schema from './schema';
import env from '$lib/env/server';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const db = drizzle(postgres(env.DATABASE_URL), { schema });

export default db;
