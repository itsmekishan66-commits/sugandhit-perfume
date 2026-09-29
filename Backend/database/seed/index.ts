import 'dotenv/config';
import { seedAdmins, seedChartOfAccounts } from './users.seed.js';
import { seedProducts } from './products.seed.js';
import { seedCustomization } from './customization.seed.js';

try {
  await seedProducts();
  await seedAdmins();
  await seedChartOfAccounts();
  // Creates the notes / bases / sizes / bottletypes / settings tables, then seeds each.
  await seedCustomization();
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
