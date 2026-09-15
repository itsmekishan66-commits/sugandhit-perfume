import { periodSnapshot } from './report.service.js';
import { reconciliationDashboard } from './paymentReconciliation.service.js';

export const getAccountingOverview = async (from?: number, to?: number) => {
  const snapshot = await periodSnapshot(from, to);
  const previousRange = from !== undefined && to !== undefined ? { from: from - (to - from), to: from - 1 } : null;
  const previous = previousRange ? await periodSnapshot(previousRange.from, previousRange.to) : null;
  const reconciliation = await reconciliationDashboard();
  return {
    ...snapshot,
    unreconciled: reconciliation.unreconciledAmount,
    previous: previous
      ? {
          totalIncome: previous.totalIncome,
          totalExpenses: previous.totalExpenses,
          netProfit: previous.netProfit,
        }
      : null,
  };
};