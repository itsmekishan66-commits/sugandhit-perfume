import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../models/schema.js';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL || `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'sugandhit_perfume'}`;

const pool = new Pool({ connectionString, max: 10 });

const db = drizzle(pool, { schema });

export default db;
export { pool };