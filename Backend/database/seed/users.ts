import { env } from '../../config/env.js';

export const adminCredentials = [
  {
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    role: env.ADMIN_ROLE,
  },
  { name: 'Manager', email: 'manager@sugandhit.com', password: 'manager@12345', role: 'admin' },
  { name: 'Editor', email: 'editor@sugandhit.com', password: 'editor@12345', role: 'admin' },
];

export const defaultPaymentAccount = {
  name: 'Cash in Hand',
  accountType: 'cash',
  openingBalance: '0',
};