import PageHeader from '../components/PageHeader';
import { SectionCard, StatCard, Pill } from '../components/finance/FinanceUI';
import { currency } from '../config';

const AccountingSettings = () => {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Accounting Settings" subtitle="Double-entry accounting engine configuration" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Method" value="Double-entry" tint="from-gold-soft to-gold" />
        <StatCard label="Base Currency" value={currency} tint="from-blush to-sand" />
        <StatCard label="Chart Accounts" value="~40 seeded" tint="from-sand to-espresso" />
      </div>

      <SectionCard title="Journal Engine">
        <div className="p-5 flex flex-col gap-4 text-sm text-ink-soft">
          <div className="rounded-xl border border-gold/15 bg-cream/60 p-4">
            <p className="font-medium text-ink mb-1">Balanced entries only</p>
            <p>Journal entries are validated so total debits equal total credits. Each line must be single-sided (a debit or a credit, not both).</p>
          </div>
          <div className="rounded-xl border border-gold/15 bg-cream/60 p-4">
            <p className="font-medium text-ink mb-1">Status flow</p>
            <p>Entries start as <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">draft</code>, are <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">posted</code> to the ledger, and can be <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">reversed</code> (creates an offsetting entry) or <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">voided</code> (drafts only).</p>
          </div>
          <div className="rounded-xl border border-gold/15 bg-cream/60 p-4">
            <p className="font-medium text-ink mb-1">Chart of accounts</p>
            <p>Accounts are identified by a unique code. Balances follow the account's normal balance (debit or credit). Opening balances are journalised like any other entry.</p>
          </div>
          <div className="rounded-xl border border-gold/15 bg-cream/60 p-4">
            <p className="font-medium text-ink mb-1">Periods &amp; reports</p>
            <p>Reports (trial balance, P&amp;L, balance sheet, cash flow) aggregate posted entries. Cash flow uses the Cash in Hand / Bank Account / eSewa / Khalti asset accounts with operating / investing / financing classification by reference type.</p>
          </div>
          <Pill tone="gold">No accounts-close / reclassification wizard yet; periods close manually.</Pill>
        </div>
      </SectionCard>
    </div>
  );
};

export default AccountingSettings;