import { sql } from 'drizzle-orm';
import db from '../client.js';
import { admins, notes, perfumebases, chartOfAccounts, paymentAccounts } from '../schema/index.js';
import { hashPassword } from '../../shared/utils/crypto.js';
import { defaultNotes } from './notes.js';
import { defaultBases } from './bases.js';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../../shared/constants/finance.constants.js';

export const seedPalette = async () => {
  const { rows } = await db.execute(
    sql`select (select count(*) from notes) + (select count(*) from perfumebases) as total`
  );
  const total = Number(rows[0].total);
  if (total > 0) {
    console.log(`Palette already seeded (${total} rows).`);
    return;
  }
  await db.insert(notes).values(defaultNotes);
  await db.insert(perfumebases).values(defaultBases);
  console.log('Palette seeded');
};

export const seedAdmins = async () => {
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
  console.log(`Admins seeded (${credentials.length})`);
};

export const seedChartOfAccounts = async () => {
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
  console.log(`Chart of accounts seeded (${DEFAULT_CHART_OF_ACCOUNTS.length} accounts)`);
};
