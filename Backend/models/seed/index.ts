import 'dotenv/config';
import { sql } from 'drizzle-orm';
import db from '../../config/db.js';
import { notes, perfumebases, products, admins, chartOfAccounts, paymentAccounts } from '../schema/index.js';
import { hashPassword } from '../../utils/helper.js';
import { defaultNotes } from './notes.js';
import { defaultBases } from './bases.js';
import { defaultProducts } from './products.js';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../../utils/finance.constants.js';

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

const ensureAdminsTable = async () => {
  await db.execute(sql`
    create table if not exists admins (
      id serial primary key,
      name text not null,
      email text not null unique,
      password text not null,
      role text not null default 'admin',
      active boolean not null default true,
      created_at timestamp with time zone default now()
    )
  `);
};

const seedAdmins = async () => {
  await ensureAdminsTable();
  const credentials = [
    { name: 'Super Admin', email: 'superadmin@admin.com', password: 'super@12345', role: 'superadmin' },
    { name: 'Manager', email: 'manager@sugandhit.com', password: 'manager@12345', role: 'admin' },
    { name: 'Editor', email: 'editor@sugandhit.com', password: 'editor@12345', role: 'admin' },
  ];
  const existing = await db.query.admins.findFirst();
  if (existing) {
    console.log('Admins already seeded.');
    return;
  }
  for (const admin of credentials) {
    await db.insert(admins).values({
      name: admin.name,
      email: admin.email,
      password: await hashPassword(admin.password),
      role: admin.role,
    });
  }
  console.log(`Admins seeded ✓ (${credentials.length})`);
};

const seedProducts = async () => {
  await ensureColumns();
  await db.delete(products);
  const day = 86400000;
  const now = Date.now();
  const rows = defaultProducts.map((p, i) => {
    return {
      ...p,
      variants: [],
      image: p.image?.length
        ? p.image
        : [`https://placehold.co/600x800/1a1a1a/c9a227?text=${encodeURIComponent(p.name)}`],
      date: now - i * day,
    };
  });
  await db.insert(products).values(rows);
  console.log(`Products seeded ✓ (${rows.length})`);
};

const seedChartOfAccounts = async () => {
  const existing = await db.query.chartOfAccounts.findFirst();
  if (existing) {
    console.log('Chart of accounts already seeded.');
    return;
  }
  const now = Date.now();
  await db.insert(chartOfAccounts).values(
    DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({
      code: a.code,
      name: a.name,
      accountType: a.type,
      normalBalance: a.normalBalance,
      createdAt: now,
      updatedAt: now,
    }))
  );
  await db.insert(paymentAccounts).values({
    name: 'Cash in Hand',
    accountType: 'cash',
    openingBalance: '0',
    createdAt: now,
    updatedAt: now,
  });
  console.log(`Chart of accounts seeded ✓ (${DEFAULT_CHART_OF_ACCOUNTS.length} accounts)`);
};

try {
  await seedPalette();
  await seedProducts();
  await seedAdmins();
  await seedChartOfAccounts();
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}