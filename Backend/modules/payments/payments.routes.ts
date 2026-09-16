import express from 'express';
import {
  overview,
  channelReport,
  linkStatus,
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deactivateAccount,
  accountLedger,
  transactions,
  transactionDetail,
  recordManual,
  webhook,
  updateStatus,
  reconcileTransaction,
  refundList,
  refundCreate,
  refundApprove,
  reconciliationList,
  reconciliationCreate,
  reconciliationDetail,
  reconciliationAddItem,
  reconciliationMatch,
  reconciliationLock,
  reconciliationSummary,
  exportCsv,
} from './payments.controller.js';
import { loadAdmin, requireAdmin } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { PERMISSIONS } from '../../shared/constants/finance.constants.js';
import {
  paymentAccountCreateSchema,
  paymentAccountUpdateSchema,
  manualPaymentSchema,
  refundCreateSchema,
  refundApproveSchema,
  reconciliationCreateSchema,
  reconciliationItemAddSchema,
  reconciliationMatchSchema,
  reconciliationLockSchema,
} from './payments.validation.js';

const paymentRouter = express.Router();

paymentRouter.use(loadAdmin);

paymentRouter.get('/', requireAdmin(PERMISSIONS.payments_view), overview);
paymentRouter.get('/channels', requireAdmin(PERMISSIONS.payments_view), channelReport);
paymentRouter.get('/status', requireAdmin(PERMISSIONS.payments_view), linkStatus);
paymentRouter.get('/export', requireAdmin(PERMISSIONS.payments_view), transactions);
paymentRouter.post('/export', requireAdmin(PERMISSIONS.payments_export), exportCsv);

paymentRouter.get('/accounts', requireAdmin(PERMISSIONS.payments_view), listAccounts);
paymentRouter.post('/accounts', requireAdmin(PERMISSIONS.payments_create), validate(paymentAccountCreateSchema), createAccount);
paymentRouter.get('/accounts/:id', requireAdmin(PERMISSIONS.payments_view), getAccount);
paymentRouter.put('/accounts/:id', requireAdmin(PERMISSIONS.payments_edit), validate(paymentAccountUpdateSchema), updateAccount);
paymentRouter.post('/accounts/:id/deactivate', requireAdmin(PERMISSIONS.payments_edit), deactivateAccount);
paymentRouter.get('/accounts/:id/ledger', requireAdmin(PERMISSIONS.payments_view), accountLedger);

paymentRouter.get('/transactions', requireAdmin(PERMISSIONS.payments_view), transactions);
paymentRouter.get('/transactions/:id', requireAdmin(PERMISSIONS.payments_view), transactionDetail);
paymentRouter.post('/transactions/manual', requireAdmin(PERMISSIONS.payments_create), validate(manualPaymentSchema), recordManual);
paymentRouter.post('/transactions/status', requireAdmin(PERMISSIONS.payments_edit), updateStatus);
paymentRouter.post('/transactions/reconcile', requireAdmin(PERMISSIONS.payments_reconcile), reconcileTransaction);

paymentRouter.post('/webhook', webhook);

paymentRouter.get('/refunds', requireAdmin(PERMISSIONS.payments_view), refundList);
paymentRouter.post('/refunds', requireAdmin(PERMISSIONS.payments_refund), validate(refundCreateSchema), refundCreate);
paymentRouter.post('/refunds/approve', requireAdmin(PERMISSIONS.payments_refund), validate(refundApproveSchema), refundApprove);

paymentRouter.get('/reconciliations', requireAdmin(PERMISSIONS.payments_reconcile), reconciliationList);
paymentRouter.post('/reconciliations', requireAdmin(PERMISSIONS.payments_reconcile), validate(reconciliationCreateSchema), reconciliationCreate);
paymentRouter.get('/reconciliations/summary', requireAdmin(PERMISSIONS.payments_reconcile), reconciliationSummary);
paymentRouter.get('/reconciliations/:id', requireAdmin(PERMISSIONS.payments_reconcile), reconciliationDetail);
paymentRouter.post('/reconciliations/items', requireAdmin(PERMISSIONS.payments_reconcile), validate(reconciliationItemAddSchema), reconciliationAddItem);
paymentRouter.post('/reconciliations/match', requireAdmin(PERMISSIONS.payments_reconcile), validate(reconciliationMatchSchema), reconciliationMatch);
paymentRouter.post('/reconciliations/lock', requireAdmin(PERMISSIONS.payments_reconcile), validate(reconciliationLockSchema), reconciliationLock);

export default paymentRouter;
