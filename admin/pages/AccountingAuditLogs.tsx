import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, TableShell, Th, Td, Row, Pill, inputCls } from '../components/finance/FinanceUI';
import { api, formatDateTime } from '../utils/finance';

interface AuditLog {
  _id: string;
  id: number;
  actorId?: number | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  previousValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  reason: string;
  ip: string;
  createdAt: number;
}

interface AdminBrief {
  id: number;
  name?: string;
  email?: string;
  username?: string;
}

const AccountingAuditLogs = ({ token }: { token: string }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [admins, setAdmins] = useState<AdminBrief[]>([]);
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);

  const actorName = (id?: number | null) => {
    const a = admins.find((x) => x.id === id);
    return a ? (a.name || a.username || a.email || `#${a.id}`) : id ? `Admin #${id}` : 'System';
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = entityType ? `?entityType=${encodeURIComponent(entityType)}` : '';
      const [res, adminsRes] = await Promise.all([
        api<{ success: boolean; logs: AuditLog[] }>(`/api/accounts/audit-logs${q}`, token),
        api<{ success: boolean; admins: AdminBrief[] }>('/api/accounts/admins', token),
      ]);
      setLogs(res.logs);
      setAdmins(adminsRes.admins || []);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, entityType]);

  useEffect(() => {
    load();
  }, [load]);

  const preview = (v: Record<string, unknown>) => {
    const entries = Object.entries(v ?? {});
    if (entries.length === 0) return '—';
    return entries.map(([k, val]) => `${k}=${typeof val === 'object' ? JSON.stringify(val) : String(val)}`).join(', ');
  };

  const tones: Record<string, string> = {
    create: 'green', update: 'amber', delete: 'red', status_change: 'gold', payment: 'gold', close: 'red', reopen: 'amber', post: 'blue', match: 'green',
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Audit Logs" subtitle="Who changed what, and when, across accounting modules" />

      <SectionCard>
        <div className="px-6 py-3 border-b border-gold/10 flex flex-wrap items-center gap-3">
          <select className={`${inputCls} w-56 select-soft`} value={entityType} onChange={(e) => { setEntityType(e.target.value); }}>
            <option value="">All entity types</option>
            {[...new Set(logs.map((l) => l.entityType))].sort().map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="text-xs text-ink-soft">{logs.length} of latest 200 entries</span>
        </div>
        {loading ? (
          <p className="text-center text-ink-soft/60 py-10">Loading audit logs…</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No audit entries recorded yet.</p>
        ) : (
          <TableShell head={<><Th>Time</Th><Th>Actor</Th><Th>Action</Th><Th>Entity</Th><Th>Reason</Th><Th>Changes</Th></>}>
            {logs.map((l) => (
              <Row key={l._id}>
                <Td className="whitespace-nowrap text-ink-soft">{formatDateTime(l.createdAt)}</Td>
                <Td>
                  <p className="font-medium text-ink">{actorName(l.actorId)}</p>
                  <p className="text-xs text-ink-soft">{l.actorRole || 'system'}{l.ip ? ` · ${l.ip}` : ''}</p>
                </Td>
                <Td><Pill tone={tones[l.action] ?? undefined}>{l.action}</Pill></Td>
                <Td>
                  <span className="text-ink">{l.entityType}</span>
                  {l.entityId ? <span className="text-xs text-ink-soft"> · #{l.entityId}</span> : null}
                </Td>
                <Td className="text-ink-soft">{l.reason || '—'}</Td>
                <Td className="text-xs text-ink-soft max-w-lg">
                  {Object.keys(l.newValue ?? {}).length > 0 ? `New: ${preview(l.newValue)}` : l.action === 'update' ? `Old: ${preview(l.previousValue)}` : '—'}
                </Td>
              </Row>
            ))}
          </TableShell>
        )}
      </SectionCard>
    </div>
  );
};

export default AccountingAuditLogs;