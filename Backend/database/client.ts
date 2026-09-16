import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';
import { env } from '../config/env.js';

const { Pool } = pg;

const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });

const db = drizzle(pool, { schema });

export default db;
export { pool };
