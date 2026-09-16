import 'dotenv/config';
import { seedPalette, seedAdmins, seedChartOfAccounts } from './users.seed.js';
import { seedProducts } from './products.seed.js';

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
