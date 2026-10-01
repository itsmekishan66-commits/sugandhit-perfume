import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '@/components/data-display/PageHeader';
import Loading from '@/components/feedback/Loading';
import { apiSaveSettings, fetchSettings } from '../settings.service';
import type { Settings } from '../settings.types';

const DEFAULTS: Settings = {
  shopName: 'Sugandhit Studio',
  currency: 'NPR',
  currencySymbol: 'रू',
  timezone: 'Asia/Kathmandu',
  footerText: '',
  currencyFormat: 'ne-NP',
};

const SettingsPage = ({ token }: { token: string }) => {
  const [form, setForm] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSettings(token);
      setForm({ ...DEFAULTS, ...res.settings });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  const set = (key: keyof Settings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiSaveSettings(token, form);
      setForm({ ...DEFAULTS, ...res.settings });
      setSaved(true);
      toast.success('Settings saved.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm({ ...DEFAULTS });
    toast.success('Settings reset to defaults. Save to apply.');
  };

  if (loading) return <Loading />;

  const fieldCls = 'w-full rounded-xl border border-gold/20 bg-cream/50 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold';

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure the storefront and admin behaviour"
      />

      <div className="grid gap-6 lg:grid-cols-1">
        <div className="rounded-2xl border border-gold/15 bg-white/70 p-6 shadow-sm">
          <p className="font-display text-xl font-semibold text-ink mb-4">General</p>
          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-ink-soft">Shop Name</label>
              <input className={fieldCls} value={form.shopName} onChange={(e) => set('shopName', e.target.value)} placeholder="Sugandhit Studio" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm text-ink-soft">Currency Code</label>
                <input className={fieldCls} value={form.currency} onChange={(e) => set('currency', e.target.value)} placeholder="NPR" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-ink-soft">Currency Symbol</label>
                <input className={fieldCls} value={form.currencySymbol} onChange={(e) => set('currencySymbol', e.target.value)} placeholder="रू" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm text-ink-soft">Timezone</label>
                <input className={fieldCls} value={form.timezone} onChange={(e) => set('timezone', e.target.value)} placeholder="Asia/Kathmandu" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-ink-soft">Number Format Locale</label>
                <input className={fieldCls} value={form.currencyFormat} onChange={(e) => set('currencyFormat', e.target.value)} placeholder="ne-NP" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-ink-soft">Footer Text</label>
              <input className={fieldCls} value={form.footerText} onChange={(e) => set('footerText', e.target.value)} placeholder="© Sugandhit Studio" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button onClick={save} disabled={saving} className="btn-primary px-8 py-2.5 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        <button onClick={reset} className="px-6 py-2.5 text-sm text-ink-soft hover:text-espresso">Reset to Defaults</button>
        {saved && <span className="text-sm text-gold font-medium">Saved ✓</span>}
      </div>
    </div>
  );
};

export default SettingsPage;