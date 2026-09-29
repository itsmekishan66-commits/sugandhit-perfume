import { sql } from 'drizzle-orm';
import db from '../client.js';
import { admins, chartOfAccounts, paymentAccounts } from '../schema/index.js';
import { hashPassword } from '../../shared/utils/crypto.js';
import { adminCredentials, defaultPaymentAccount } from './users.js';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../../shared/constants/finance.constants.js';

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
  const existing = await db.query.admins.findFirst();
  if (existing) {
    console.log('Admins already seeded.');
    return;
  }
  for (const admin of adminCredentials) {
    await db.insert(admins).values({
      name: admin.name,
      email: admin.email,
      password: await hashPassword(admin.password),
      role: admin.role,
    });
  }
  console.log(`Admins seeded (${adminCredentials.length})`);
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
    ...defaultPaymentAccount,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`Chart of accounts seeded (${DEFAULT_CHART_OF_ACCOUNTS.length} accounts)`);
};
