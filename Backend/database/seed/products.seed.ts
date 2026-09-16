import db from '../client.js';
import { products } from '../schema/index.js';
import { defaultProducts } from './products.js';

export const ensureColumns = async () => {
  const { sql } = await import('drizzle-orm');
  await db.execute(sql`alter table products add column if not exists rating numeric(3,2) default 4.5`);
  await db.execute(sql`alter table products add column if not exists reviews integer default 0`);
  await db.execute(sql`alter table products add column if not exists badge text`);
};

export const seedProducts = async () => {
  await ensureColumns();
  await db.delete(products);
  const day = 86400000;
  const now = Date.now();
  const rows = defaultProducts.map((p, i) => ({
    ...p,
    variants: [] as never[],
    image: p.image?.length
      ? p.image
      : [`https://placehold.co/600x800/1a1a1a/c9a227?text=${encodeURIComponent(p.name)}`],
    date: now - i * day,
  }));
  await db.insert(products).values(rows);
  console.log(`Products seeded (${rows.length})`);
};
