import 'dotenv/config';
import { sql } from 'drizzle-orm';
import db from '../../config/db.js';
import { notes, perfumebases, products } from '../schema/index.js';
import { defaultNotes } from './notes.js';
import { defaultBases } from './bases.js';
import { defaultProducts } from './products.js';

const countPalette = async () => {
  const { rows } = await db.execute(sql`select (select count(*) from notes) + (select count(*) from perfumebases) as total`);
  return Number(rows[0].total);
};


const seedPalette = async () => {
  const total = await countPalette();
  if (total > 0) {
    console.log(`Palette already seeded (${total} rows).`);
    return;
  }
  await db.insert(notes).values(defaultNotes);
  await db.insert(perfumebases).values(defaultBases);
  console.log('Palette seeded ✓');
};

const ensureColumns = async () => {
  await db.execute(sql`alter table products add column if not exists rating numeric(3,2) default 4.5`);
  await db.execute(sql`alter table products add column if not exists reviews integer default 0`);
  await db.execute(sql`alter table products add column if not exists badge text`);
};

const seedProducts = async () => {
  await ensureColumns();
  await db.delete(products);
  const day = 86400000;
  const now = Date.now();
  const rows = defaultProducts.map((p, i) => ({
    ...p,
    image: p.image?.length
      ? p.image
      : [`https://placehold.co/600x800/1a1a1a/c9a227?text=${encodeURIComponent(p.name)}`],
    date: now - i * day,
  }));
  await db.insert(products).values(rows);
  console.log(`Products seeded ✓ (${rows.length})`);
};

try {
  await seedPalette();
  await seedProducts();
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}