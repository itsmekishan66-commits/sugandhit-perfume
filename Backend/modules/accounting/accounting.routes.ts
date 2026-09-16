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
  payableList,
  payableCreate,
  payableApprove,
  payablePay,
  payableAgingReport,
  payableMaintain,
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
  auditList,
} from './accounting.controller.js';
import { loadAdmin, requireAdmin } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { PERMISSIONS } from '../../shared/constants/finance.constants.js';
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
  payableCreateSchema,
  payableApproveSchema,
  payablePaySchema,
  payableMaintenanceSchema,
  periodCreateSchema,
  periodCloseSchema,
} from './accounting.validation.js';

const accountingRouter = express.Router();

accountingRouter.use(loadAdmin);

accountingRouter.get('/overview', requireAdmin(PERMISSIONS.accounts_view), overview);

accountingRouter.get('/chart', requireAdmin(PERMISSIONS.accounts_view), chartList);
accountingRouter.post('/chart', requireAdmin(PERMISSIONS.accounts_manage_chart), validate(chartAccountSchema), chartCreate);
accountingRouter.put('/chart/:id', requireAdmin(PERMISSIONS.accounts_manage_chart), validate(chartAccountUpdateSchema), chartUpdate);
accountingRouter.post('/chart/:id/deactivate', requireAdmin(PERMISSIONS.accounts_manage_chart), chartDeactivate);

accountingRouter.get('/journals', requireAdmin(PERMISSIONS.accounts_view), journalList);
accountingRouter.get('/journals/:id', requireAdmin(PERMISSIONS.accounts_view), journalDetail);
accountingRouter.post('/journals', requireAdmin(PERMISSIONS.accounts_create_journal), validate(journalCreateSchema), journalCreate);
accountingRouter.post('/journals/post', requireAdmin(PERMISSIONS.accounts_post_journal), validate(journalPostSchema), journalPost);
accountingRouter.post('/journals/reverse', requireAdmin(PERMISSIONS.accounts_reverse_journal), validate(journalReverseSchema), journalReverse);
accountingRouter.post('/journals/void', requireAdmin(PERMISSIONS.accounts_reverse_journal), validate(journalVoidSchema), journalVoid);

accountingRouter.get('/ledger', requireAdmin(PERMISSIONS.accounts_view), ledger);
accountingRouter.get('/trial-balance', requireAdmin(PERMISSIONS.accounts_view_reports), trialBalance);
accountingRouter.get('/profit-loss', requireAdmin(PERMISSIONS.accounts_view_reports), profitLoss);
accountingRouter.get('/balance-sheet', requireAdmin(PERMISSIONS.accounts_view_reports), balanceSheet);
accountingRouter.get('/cash-flow', requireAdmin(PERMISSIONS.accounts_view_reports), cashFlow);

accountingRouter.get('/periods', requireAdmin(PERMISSIONS.accounts_view), periodList);
accountingRouter.post('/periods', requireAdmin(PERMISSIONS.accounts_manage_periods), validate(periodCreateSchema), periodCreate);
accountingRouter.post('/periods/close', requireAdmin(PERMISSIONS.accounts_manage_periods), validate(periodCloseSchema), periodClose);
accountingRouter.post('/periods/reopen', requireAdmin(PERMISSIONS.accounts_manage_periods), validate(periodCloseSchema), periodReopen);

accountingRouter.get('/payables', requireAdmin(PERMISSIONS.payables_view), payableList);
accountingRouter.post('/payables', requireAdmin(PERMISSIONS.payables_manage), validate(payableCreateSchema), payableCreate);
accountingRouter.post('/payables/approve', requireAdmin(PERMISSIONS.payables_manage), validate(payableApproveSchema), payableApprove);
accountingRouter.post('/payables/pay', requireAdmin(PERMISSIONS.payables_manage), validate(payablePaySchema), payablePay);
accountingRouter.get('/payables/aging', requireAdmin(PERMISSIONS.payables_view), payableAgingReport);
accountingRouter.post('/payables/maintain', requireAdmin(PERMISSIONS.payables_manage), validate(payableMaintenanceSchema), payableMaintain);

accountingRouter.post('/income', requireAdmin(PERMISSIONS.accounts_create_journal), validate(incomeCreateSchema), incomeCreateController);
accountingRouter.get('/income', requireAdmin(PERMISSIONS.accounts_view), incomeListController);
accountingRouter.get('/income/totals', requireAdmin(PERMISSIONS.accounts_view), incomeTotals);

accountingRouter.post('/expenses', requireAdmin(PERMISSIONS.accounts_create_journal), validate(expenseCreateSchema), expenseCreateController);
accountingRouter.get('/expenses', requireAdmin(PERMISSIONS.accounts_view), expenseListController);
accountingRouter.get('/expenses/totals', requireAdmin(PERMISSIONS.accounts_view), expenseTotals);
accountingRouter.post('/expenses/approve', requireAdmin(PERMISSIONS.accounts_post_journal), validate(expenseApproveSchema), expenseApproveController);
accountingRouter.post('/expenses/pay', requireAdmin(PERMISSIONS.accounts_post_journal), validate(expensePaySchema), expensePayController);
accountingRouter.put('/expenses/:id', requireAdmin(PERMISSIONS.accounts_create_journal), validate(expenseUpdateSchema), expenseUpdateController);

accountingRouter.post('/export', requireAdmin(PERMISSIONS.accounts_export), auditableExport);

accountingRouter.get('/audit-logs', requireAdmin(PERMISSIONS.accounts_view), auditList);

export default accountingRouter;