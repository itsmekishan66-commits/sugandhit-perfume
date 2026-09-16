import express from 'express';
import {
  overview,
  chartList,
  chartCreate,
  chartUpdate,
  chartDeactivate,
  journalList,
  journalDetail,
  journalCreate,
  journalPost,
  journalReverse,
  journalVoid,
  ledger,
  trialBalance,
  profitLoss,
  balanceSheet,
  cashFlow,
  periodList,
  periodCreate,
  periodClose,
  periodReopen,
  vendorList,
  vendorCreate,
  vendorUpdate,
  vendorToggle,
  vendorDetail,
  vendorDelete,
  payableList,
  payableCreate,
  payableApprove,
  payablePay,
  payableAgingReport,
  payableMaintain,
  receivableList,
  receivableAgingReport,
  receivableStatement,
  receivableAdjust,
  incomeCreateController,
  incomeListController,
  incomeTotals,
  expenseCreateController,
  expenseListController,
  expenseTotals,
  expenseApproveController,
  expensePayController,
  expenseUpdateController,
  auditableExport,
  userList,
  adminList,
  userDetail,
  userCredit,
  auditList,
} from '../controllers/accounts.controller.js';
import { loadAdmin, requireAdmin } from '../middleware/permission.middleware.js';
import { validate } from '../validate/index.js';
import { PERMISSIONS } from '../utils/finance.constants.js';
import {
  chartAccountSchema,
  chartAccountUpdateSchema,
  journalCreateSchema,
  journalPostSchema,
  journalReverseSchema,
  journalVoidSchema,
  incomeCreateSchema,
  expenseCreateSchema,
  expenseUpdateSchema,
  expenseApproveSchema,
  expensePaySchema,
  vendorCreateSchema,
  vendorUpdateSchema,
  payableCreateSchema,
  payableApproveSchema,
  payablePaySchema,
  payableMaintenanceSchema,
  receivableAdjustSchema,
  periodCreateSchema,
  periodCloseSchema,
} from '../validate/finance.validate.js';

const accountsRouter = express.Router();

accountsRouter.use(loadAdmin);

accountsRouter.get('/overview', requireAdmin(PERMISSIONS.accounts_view), overview);

accountsRouter.get('/chart', requireAdmin(PERMISSIONS.accounts_view), chartList);
accountsRouter.post('/chart', requireAdmin(PERMISSIONS.accounts_manage_chart), validate(chartAccountSchema), chartCreate);
accountsRouter.put('/chart/:id', requireAdmin(PERMISSIONS.accounts_manage_chart), validate(chartAccountUpdateSchema), chartUpdate);
accountsRouter.post('/chart/:id/deactivate', requireAdmin(PERMISSIONS.accounts_manage_chart), chartDeactivate);

accountsRouter.get('/journals', requireAdmin(PERMISSIONS.accounts_view), journalList);
accountsRouter.get('/journals/:id', requireAdmin(PERMISSIONS.accounts_view), journalDetail);
accountsRouter.post('/journals', requireAdmin(PERMISSIONS.accounts_create_journal), validate(journalCreateSchema), journalCreate);
accountsRouter.post('/journals/post', requireAdmin(PERMISSIONS.accounts_post_journal), validate(journalPostSchema), journalPost);
accountsRouter.post('/journals/reverse', requireAdmin(PERMISSIONS.accounts_reverse_journal), validate(journalReverseSchema), journalReverse);
accountsRouter.post('/journals/void', requireAdmin(PERMISSIONS.accounts_reverse_journal), validate(journalVoidSchema), journalVoid);

accountsRouter.get('/ledger', requireAdmin(PERMISSIONS.accounts_view), ledger);
accountsRouter.get('/trial-balance', requireAdmin(PERMISSIONS.accounts_view_reports), trialBalance);
accountsRouter.get('/profit-loss', requireAdmin(PERMISSIONS.accounts_view_reports), profitLoss);
accountsRouter.get('/balance-sheet', requireAdmin(PERMISSIONS.accounts_view_reports), balanceSheet);
accountsRouter.get('/cash-flow', requireAdmin(PERMISSIONS.accounts_view_reports), cashFlow);

accountsRouter.get('/periods', requireAdmin(PERMISSIONS.accounts_view), periodList);
accountsRouter.post('/periods', requireAdmin(PERMISSIONS.accounts_manage_periods), validate(periodCreateSchema), periodCreate);
accountsRouter.post('/periods/close', requireAdmin(PERMISSIONS.accounts_manage_periods), validate(periodCloseSchema), periodClose);
accountsRouter.post('/periods/reopen', requireAdmin(PERMISSIONS.accounts_manage_periods), validate(periodCloseSchema), periodReopen);

accountsRouter.get('/vendors', requireAdmin(PERMISSIONS.payables_view), vendorList);
accountsRouter.get('/vendors/:id', requireAdmin(PERMISSIONS.payables_view), vendorDetail);
accountsRouter.post('/vendors', requireAdmin(PERMISSIONS.payables_manage), validate(vendorCreateSchema), vendorCreate);
accountsRouter.put('/vendors/:id', requireAdmin(PERMISSIONS.payables_manage), validate(vendorUpdateSchema), vendorUpdate);
accountsRouter.post('/vendors/:id/toggle', requireAdmin(PERMISSIONS.payables_manage), vendorToggle);
accountsRouter.delete('/vendors/:id', requireAdmin(PERMISSIONS.payables_manage), vendorDelete);

accountsRouter.get('/payables', requireAdmin(PERMISSIONS.payables_view), payableList);
accountsRouter.post('/payables', requireAdmin(PERMISSIONS.payables_manage), validate(payableCreateSchema), payableCreate);
accountsRouter.post('/payables/approve', requireAdmin(PERMISSIONS.payables_manage), validate(payableApproveSchema), payableApprove);
accountsRouter.post('/payables/pay', requireAdmin(PERMISSIONS.payables_manage), validate(payablePaySchema), payablePay);
accountsRouter.get('/payables/aging', requireAdmin(PERMISSIONS.payables_view), payableAgingReport);
accountsRouter.post('/payables/maintain', requireAdmin(PERMISSIONS.payables_manage), validate(payableMaintenanceSchema), payableMaintain);

accountsRouter.get('/receivables', requireAdmin(PERMISSIONS.receivables_view), receivableList);
accountsRouter.get('/receivables/aging', requireAdmin(PERMISSIONS.receivables_view), receivableAgingReport);
accountsRouter.get('/receivables/statement/:customerId', requireAdmin(PERMISSIONS.receivables_view), receivableStatement);
accountsRouter.post('/receivables/adjust', requireAdmin(PERMISSIONS.receivables_manage), validate(receivableAdjustSchema), receivableAdjust);

accountsRouter.post('/income', requireAdmin(PERMISSIONS.accounts_create_journal), validate(incomeCreateSchema), incomeCreateController);
accountsRouter.get('/income', requireAdmin(PERMISSIONS.accounts_view), incomeListController);
accountsRouter.get('/income/totals', requireAdmin(PERMISSIONS.accounts_view), incomeTotals);

accountsRouter.post('/expenses', requireAdmin(PERMISSIONS.accounts_create_journal), validate(expenseCreateSchema), expenseCreateController);
accountsRouter.get('/expenses', requireAdmin(PERMISSIONS.accounts_view), expenseListController);
accountsRouter.get('/expenses/totals', requireAdmin(PERMISSIONS.accounts_view), expenseTotals);
accountsRouter.post('/expenses/approve', requireAdmin(PERMISSIONS.accounts_post_journal), validate(expenseApproveSchema), expenseApproveController);
accountsRouter.post('/expenses/pay', requireAdmin(PERMISSIONS.accounts_post_journal), validate(expensePaySchema), expensePayController);
accountsRouter.put('/expenses/:id', requireAdmin(PERMISSIONS.accounts_create_journal), validate(expenseUpdateSchema), expenseUpdateController);

accountsRouter.post('/export', requireAdmin(PERMISSIONS.accounts_export), auditableExport);

accountsRouter.get('/audit-logs', requireAdmin(PERMISSIONS.accounts_view), auditList);

accountsRouter.get('/users', requireAdmin(PERMISSIONS.accounts_view), userList);
accountsRouter.get('/admins', requireAdmin(PERMISSIONS.accounts_view), adminList);
accountsRouter.post('/user/details', requireAdmin(PERMISSIONS.accounts_view), userDetail);
accountsRouter.post('/user/credit', requireAdmin(PERMISSIONS.payments_create), userCredit);

export default accountsRouter;