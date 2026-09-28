import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { PageHeader, ConfirmDialog } from '../../components';

interface Note {
  id: string;
  name: string;
  icon: string;
  color: string;
  price: number;
}

interface PaletteBase {
  id: string;
  name: string;
  code: string;
  description: string;
  extraPrice: number;
}

interface SizeOption {
  id: string;
  label: string;
  ml: string;
  price: number;
  desc: string;
}

interface CustomizationData {
  topNotes: Note[];
  heartNotes: Note[];
  baseNotes: Note[];
  bases: PaletteBase[];
  sizes: SizeOption[];
  maxNotesPerLayer: number;
  deliveryFee: number;
}

type LayerKey = 'topNotes' | 'heartNotes' | 'baseNotes';
type TabKey = 'notes' | 'bases' | 'sizes' | 'settings';
type SectionKey = LayerKey | 'bases' | 'sizes' | 'settings';

interface Message {
  kind: 'error' | 'info' | 'success';
  text: string;
}

interface Drafts {
  topNotes: Note[];
  heartNotes: Note[];
  baseNotes: Note[];
  bases: PaletteBase[];
  sizes: SizeOption[];
}

const STORAGE_KEY = 'sugandhit_customization_data_v1';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_DATA: CustomizationData = {
  topNotes: [],
  heartNotes: [],
  baseNotes: [],
  bases: [],
  sizes: [
    { id: '1', label: '30 ml', ml: '30ml', price: 399, desc: 'Samples & travel' },
    { id: '2', label: '50 ml', ml: '50ml', price: 699, desc: 'Most chosen' },
    { id: '3', label: '100 ml', ml: '100ml', price: 999, desc: 'For the committed' },
  ],
  maxNotesPerLayer: 3,
  deliveryFee: 100,
};

const LAYER_META: Record<LayerKey, { title: string; sub: string }> = {
  topNotes: { title: 'Top Notes', sub: 'The first impression — bright & fleeting' },
  heartNotes: { title: 'Heart Notes', sub: 'The soul — blooms in the middle' },
  baseNotes: { title: 'Base Notes', sub: 'The memory — lingers on skin' },
};

const EMPTY_DRAFTS: Drafts = {
  topNotes: [],
  heartNotes: [],
  baseNotes: [],
  bases: [],
  sizes: [],
};

const loadCustomizationData = (): CustomizationData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...clone(DEFAULT_DATA), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return clone(DEFAULT_DATA);
};

const Customization = () => {
  const [data, setData] = useState<CustomizationData>(loadCustomizationData);
  const [activeTab, setActiveTab] = useState<TabKey>('notes');
  const [message, setMessage] = useState<{ section: SectionKey } & Message | null>(null);

  const [drafts, setDrafts] = useState<Drafts>(clone(EMPTY_DRAFTS));
  const [editing, setEditing] = useState<Record<keyof Drafts, string | null>>({
    topNotes: null,
    heartNotes: null,
    baseNotes: null,
    bases: null,
    sizes: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<{ layer: LayerKey; id: string; name: string } | { section: 'bases' | 'sizes'; id: string; name: string } | null>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const notify = (section: SectionKey, kind: Message['kind'], text: string, msg?: string) => {
    setMessage({ section, kind, text });
    if (kind === 'error') toast.error(msg ?? text);
    else if (kind === 'info') toast.info(msg ?? text);
    else toast.success(msg ?? text);
  };

  const sectionMessage = (section: SectionKey): Message | null =>
    message && message.section === section ? { kind: message.kind, text: message.text } : null;

  const persist = (next: CustomizationData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  /* ---------- generic draft helpers ---------- */

  const addDraft = <K extends keyof Drafts>(key: K, item: Drafts[K][number]) => {
    setDrafts(prev => ({ ...prev, [key]: [...prev[key], item] }));
  };

  const updateDraftRow = <K extends keyof Drafts>(key: K, index: number, field: keyof Drafts[K][number], value: string | number) => {
    setDrafts(prev => {
      const rows = [...prev[key]];
      const original = rows[index];
      rows[index] = { ...original, [field]: value };
      return { ...prev, [key]: rows };
    });
  };

  const removeDraftRow = <K extends keyof Drafts>(key: K, index: number) => {
    setDrafts(prev => ({ ...prev, [key]: (prev[key] as unknown as unknown[]).filter((_, i) => i !== index) }));
  };

  /* ---------- Notes ---------- */

  const addNoteDraft = (layer: LayerKey) =>
    addDraft(layer, { id: genId(), name: '', icon: '🌸', color: '#000000', price: 0 });

  const saveNotes = (layer: LayerKey) => {
    const meta = LAYER_META[layer];
    const rows = drafts[layer];
    if (rows.length === 0) {
      notify(layer, 'info', 'Nothing changed to save.', 'Nothing changed to save');
      return;
    }
    const blankIdx = rows.findIndex(n => !n.name.trim());
    if (blankIdx !== -1) {
      notify(layer, 'error', `${meta.title}: note #${blankIdx + 1} name is required.`, 'Field required');
      return;
    }
    const editId = editing[layer];
    const kept = data[layer].filter(n => n.id !== editId);
    const nextNotes = [...kept, ...rows];
    const content = (n: Note) => ({ name: n.name, icon: n.icon, color: n.color, price: n.price });
    if (JSON.stringify(nextNotes.map(content)) === JSON.stringify(data[layer].map(content))) {
      notify(layer, 'info', 'Nothing changed to save.', 'Nothing changed to save');
      setDrafts(prev => ({ ...prev, [layer]: [] }));
      setEditing(prev => ({ ...prev, [layer]: null }));
      return;
    }
    const next = { ...data, [layer]: nextNotes };
    setData(next);
    persist(next);
    setDrafts(prev => ({ ...prev, [layer]: [] }));
    setEditing(prev => ({ ...prev, [layer]: null }));
    notify(layer, 'success', `${meta.title} saved.`);
  };

  const editNote = (layer: LayerKey, id: string) => {
    const item = data[layer].find(n => n.id === id);
    if (!item) return;
    setEditing(prev => ({ ...prev, [layer]: id }));
    setDrafts(prev => ({ ...prev, [layer]: [clone(item)] }));
    setMessage(null);
  };

  const deleteNote = (layer: LayerKey, id: string) => {
    const next = { ...data, [layer]: data[layer].filter(n => n.id !== id) };
    setData(next);
    persist(next);
    setEditing(prev => (prev[layer] === id ? { ...prev, [layer]: null } : prev));
    if (editing[layer] === id) setDrafts(prev => ({ ...prev, [layer]: [] }));
    notify(layer, 'success', 'Note deleted.');
  };

  const confirmDeleteNote = () => {
    if (!deleteTarget || !('layer' in deleteTarget)) return;
    deleteNote(deleteTarget.layer, deleteTarget.id);
    setDeleteTarget(null);
  };

  /* ---------- Bases ---------- */

  const addBaseDraft = () =>
    addDraft('bases', { id: genId(), name: '', code: '', description: '', extraPrice: 0 });

  const saveBases = () => {
    const rows = drafts.bases;
    if (rows.length === 0) {
      notify('bases', 'info', 'Nothing changed to save.', 'Nothing changed to save');
      return;
    }
    const blankNameIdx = rows.findIndex(b => !b.name.trim());
    if (blankNameIdx !== -1) {
      notify('bases', 'error', `Perfume Base #${blankNameIdx + 1} name is required.`, 'Field required');
      return;
    }
    const blankCodeIdx = rows.findIndex(b => !b.code.trim());
    if (blankCodeIdx !== -1) {
      notify('bases', 'error', `Perfume Base #${blankCodeIdx + 1} code is required.`, 'Field required');
      return;
    }
    const editId = editing.bases;
    const kept = data.bases.filter(b => b.id !== editId);
    const nextBases = [...kept, ...rows];
    const content = (b: PaletteBase) => ({ name: b.name, code: b.code, description: b.description, extraPrice: b.extraPrice });
    if (JSON.stringify(nextBases.map(content)) === JSON.stringify(data.bases.map(content))) {
      notify('bases', 'info', 'Nothing changed to save.', 'Nothing changed to save');
      setDrafts(prev => ({ ...prev, bases: [] }));
      setEditing(prev => ({ ...prev, bases: null }));
      return;
    }
    const next = { ...data, bases: nextBases };
    setData(next);
    persist(next);
    setDrafts(prev => ({ ...prev, bases: [] }));
    setEditing(prev => ({ ...prev, bases: null }));
    notify('bases', 'success', 'Perfume bases saved.');
  };

  const editBase = (id: string) => {
    const item = data.bases.find(b => b.id === id);
    if (!item) return;
    setEditing(prev => ({ ...prev, bases: id }));
    setDrafts(prev => ({ ...prev, bases: [clone(item)] }));
    setMessage(null);
  };

  const deleteBase = (id: string) => {
    const next = { ...data, bases: data.bases.filter(b => b.id !== id) };
    setData(next);
    persist(next);
    setEditing(prev => (prev.bases === id ? { ...prev, bases: null } : prev));
    if (editing.bases === id) setDrafts(prev => ({ ...prev, bases: [] }));
    notify('bases', 'success', 'Base deleted.');
  };

  const confirmDeleteBase = () => {
    if (!deleteTarget || !('section' in deleteTarget) || deleteTarget.section !== 'bases') return;
    deleteBase(deleteTarget.id);
    setDeleteTarget(null);
  };

  /* ---------- Sizes ---------- */

  const addSizeDraft = () =>
    addDraft('sizes', { id: genId(), label: '', ml: '', price: 0, desc: '' });

  const saveSizes = () => {
    const rows = drafts.sizes;
    if (rows.length === 0) {
      notify('sizes', 'info', 'Nothing changed to save.', 'Nothing changed to save');
      return;
    }
    const blankLabelIdx = rows.findIndex(s => !s.label.trim());
    if (blankLabelIdx !== -1) {
      notify('sizes', 'error', `Bottle Size #${blankLabelIdx + 1} label is required.`, 'Field required');
      return;
    }
    const blankMlIdx = rows.findIndex(s => !s.ml.trim());
    if (blankMlIdx !== -1) {
      notify('sizes', 'error', `Bottle Size #${blankMlIdx + 1} ml value is required.`, 'Field required');
      return;
    }
    const editId = editing.sizes;
    const kept = data.sizes.filter(s => s.id !== editId);
    const nextSizes = [...kept, ...rows];
    const content = (s: SizeOption) => ({ label: s.label, ml: s.ml, price: s.price, desc: s.desc });
    if (JSON.stringify(nextSizes.map(content)) === JSON.stringify(data.sizes.map(content))) {
      notify('sizes', 'info', 'Nothing changed to save.', 'Nothing changed to save');
      setDrafts(prev => ({ ...prev, sizes: [] }));
      setEditing(prev => ({ ...prev, sizes: null }));
      return;
    }
    const next = { ...data, sizes: nextSizes };
    setData(next);
    persist(next);
    setDrafts(prev => ({ ...prev, sizes: [] }));
    setEditing(prev => ({ ...prev, sizes: null }));
    notify('sizes', 'success', 'Bottle sizes saved.');
  };

  const editSize = (id: string) => {
    const item = data.sizes.find(s => s.id === id);
    if (!item) return;
    setEditing(prev => ({ ...prev, sizes: id }));
    setDrafts(prev => ({ ...prev, sizes: [clone(item)] }));
    setMessage(null);
  };

  const deleteSize = (id: string) => {
    const next = { ...data, sizes: data.sizes.filter(s => s.id !== id) };
    setData(next);
    persist(next);
    setEditing(prev => (prev.sizes === id ? { ...prev, sizes: null } : prev));
    if (editing.sizes === id) setDrafts(prev => ({ ...prev, sizes: [] }));
    notify('sizes', 'success', 'Size deleted.');
  };

  const confirmDeleteSize = () => {
    if (!deleteTarget || !('section' in deleteTarget) || deleteTarget.section !== 'sizes') return;
    deleteSize(deleteTarget.id);
    setDeleteTarget(null);
  };

  /* ---------- Settings ---------- */

  const saveSettings = () => {
    if (!data.maxNotesPerLayer || data.maxNotesPerLayer < 1) {
      notify('settings', 'error', 'Max Notes Per Layer is required (min 1).', 'Field required');
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<CustomizationData>;
        if (saved.maxNotesPerLayer === data.maxNotesPerLayer && saved.deliveryFee === data.deliveryFee) {
          notify('settings', 'info', 'Nothing changed to save.', 'Nothing changed to save');
          return;
        }
      }
    } catch { /* ignore */ }
    persist(data);
    notify('settings', 'success', 'Settings saved.');
  };

  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(clone(DEFAULT_DATA));
    setDrafts(clone(EMPTY_DRAFTS));
    setEditing({ topNotes: null, heartNotes: null, baseNotes: null, bases: null, sizes: null });
    setMessage(null);
    toast.success('Customization reset to defaults.');
  };

  /* ---------- UI helpers ---------- */

  const fieldCls = 'w-full rounded-xl border border-gold/20 bg-cream/50 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold';
  const labelCls = 'mb-1.5 block text-sm text-ink-soft font-medium';
  const tabBtnCls = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-gold text-cream' : 'bg-gold/10 text-ink hover:bg-gold/20'}`;
  const addBtnCls = 'px-4 py-2 bg-gold text-cream rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors';
  const smallOutlineBtn = 'px-3 py-1.5 text-sm border border-gold/30 rounded-lg hover:bg-sand transition-colors';
  const smallDangerBtn = 'px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors';

  const renderSavedList = (children: React.ReactNode) => (
    <div className="mt-5">
      <p className="text-[11px] uppercase tracking-luxe text-ink-soft/60 mb-2">Saved items</p>
      {children}
    </div>
  );

  const renderSectionMessage = (section: SectionKey) => {
    const msg = sectionMessage(section);
    if (!msg) return null;
    return (
      <div
        className={`mb-3 px-4 py-2.5 rounded-xl text-sm font-medium border ${
          msg.kind === 'error'
            ? 'bg-red-50 text-red-600 border-red-200'
            : msg.kind === 'info'
              ? 'bg-ink-soft/5 text-ink-soft border-gold/15'
              : 'bg-gold/10 text-gold border-gold/25'
        }`}
      >
        {msg.text}
      </div>
    );
  };

  const emptyState = (text: string) => (
    <p className="text-sm text-ink-soft text-center py-4 border border-dashed border-gold/20 rounded-xl">{text}</p>
  );

  /* ---------- render: notes tab ---------- */

  const renderNoteBlock = (layer: LayerKey) => {
    const meta = LAYER_META[layer];
    const rows = drafts[layer];
    const saved = data[layer];
    const isEditing = editing[layer] !== null;

    return (
      <div key={layer} className="rounded-2xl border border-gold/15 bg-white/70 p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="font-display text-xl font-semibold">{meta.title}</h3>
            <p className="text-sm text-ink-soft italic">{meta.sub}</p>
          </div>
          <button onClick={() => addNoteDraft(layer)} className={addBtnCls}>
            + Add Note
          </button>
        </div>

        {/* Draft editor */}
        {rows.length > 0 && (
          <>
            <div className="space-y-3 mb-4">
              {rows.map((note, i) => (
                <div key={note.id} className="flex gap-3 items-end justify-between p-4 border border-gold/30 rounded-xl bg-sand/40">
                  <div className="flex gap-3 flex-1 flex-wrap">
                    <div className="w-20">
                      <label className={labelCls}>Icon</label>
                      <input className={fieldCls} value={note.icon} onChange={(e) => updateDraftRow(layer, i, 'icon', e.target.value)} placeholder="🌸" />
                    </div>
                    <div className="flex-2 min-w-35">
                      <label className={labelCls}>Name</label>
                      <input className={fieldCls} value={note.name} onChange={(e) => updateDraftRow(layer, i, 'name', e.target.value)} placeholder="Rose" />
                    </div>
                    <div className="flex-1 min-w-38">
                      <label className={labelCls}>Color (hex)</label>
                      <div className="flex gap-2">
                        <input type="color" className="w-10 h-10 rounded-xl border border-gold/20 cursor-pointer" value={note.color} onChange={(e) => updateDraftRow(layer, i, 'color', e.target.value)} />
                        <input className={fieldCls} value={note.color} onChange={(e) => updateDraftRow(layer, i, 'color', e.target.value)} placeholder="#000" />
                      </div>
                    </div>
                    <div className="w-28">
                      <label className={labelCls}>Price (Rs.)</label>
                      <input type="number" min="0" className={fieldCls} value={note.price === 0 ? '' : note.price} onChange={(e) => updateDraftRow(layer, i, 'price', e.target.value === '' ? 0 : Number(e.target.value))} placeholder="0" />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeDraftRow(layer, i)} className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors" title="Remove row">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Save button — bottom right */}
            <div className="flex flex-col items-end gap-2">
              {renderSectionMessage(layer)}
              <button onClick={() => saveNotes(layer)} className="btn-primary px-6 py-2.5 text-sm">
                {isEditing ? 'Update Notes' : 'Save Notes'}
              </button>
            </div>
          </>
        )}

        {/* Saved list */}
        {renderSavedList(
          saved.length === 0 ? (
            emptyState('No saved notes yet')
          ) : (
            <div className="space-y-2">
              {saved.map(note => (
                <div key={note.id} className="flex items-center justify-between gap-3 border border-gold/15 rounded-xl px-4 py-2.5 bg-cream/40">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: note.color }} />
                    <span className="text-lg">{note.icon}</span>
                    <span className="font-medium">{note.name}</span>
                    <span className="text-sm text-ink-soft">{note.price > 0 ? `+ Rs. ${note.price}` : 'Free'}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => editNote(layer, note.id)} className={smallOutlineBtn}>Edit</button>
                    <button onClick={() => setDeleteTarget({ layer, id: note.id, name: note.name })} className={smallDangerBtn}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
  };

  /* ---------- render: bases block ---------- */

  const renderBaseBlock = () => {
    const rows = drafts.bases;
    const saved = data.bases;
    const isEditing = editing.bases !== null;

    return (
      <div className="rounded-2xl border border-gold/15 bg-white/70 p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="font-display text-xl font-semibold">Perfume Bases</h3>
            <p className="text-sm text-ink-soft italic">Different perfume concentrations and options</p>
          </div>
          <button onClick={addBaseDraft} className={addBtnCls}>
            + Add Base
          </button>
        </div>

        {rows.length > 0 && (
          <>
            <div className="space-y-3 mb-4">
              {rows.map((base, i) => (
                <div key={base.id} className="flex gap-3 items-end justify-between p-4 border border-gold/30 rounded-xl bg-sand/40">
                  <div className="flex gap-3 flex-1 flex-wrap">
                    <div className="flex-1 min-w-35">
                      <label className={labelCls}>Name</label>
                      <input className={fieldCls} value={base.name} onChange={(e) => updateDraftRow('bases', i, 'name', e.target.value)} placeholder="Eau de Toilette" />
                    </div>
                    <div className="flex-1 min-w-30">
                      <label className={labelCls}>Code</label>
                      <input className={fieldCls} value={base.code} onChange={(e) => updateDraftRow('bases', i, 'code', e.target.value)} placeholder="EDT" />
                    </div>
                    <div className="flex-2 min-w-50">
                      <label className={labelCls}>Description</label>
                      <input className={fieldCls} value={base.description} onChange={(e) => updateDraftRow('bases', i, 'description', e.target.value)} placeholder="Light and fresh" />
                    </div>
                    <div className="w-28">
                      <label className={labelCls}>Extra Price (Rs.)</label>
                      <input type="number" min="0" className={fieldCls} value={base.extraPrice} onChange={(e) => updateDraftRow('bases', i, 'extraPrice', Number(e.target.value))} placeholder="0" />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeDraftRow('bases', i)} className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors" title="Remove row">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-end gap-2">
              {renderSectionMessage('bases')}
              <button onClick={saveBases} className="btn-primary px-6 py-2.5 text-sm">
                {isEditing ? 'Update Base' : 'Save Bases'}
              </button>
            </div>
          </>
        )}

        {renderSavedList(
          saved.length === 0 ? (
            emptyState('No saved bases yet')
          ) : (
            <div className="space-y-2">
              {saved.map(base => (
                <div key={base.id} className="flex items-center justify-between gap-3 border border-gold/15 rounded-xl px-4 py-2.5 bg-cream/40">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium">{base.name}</span>
                    <span className="text-xs bg-gold/15 text-ink-soft px-2 py-0.5 rounded">{base.code}</span>
                    <span className="text-sm text-ink-soft italic hidden sm:inline">{base.description}</span>
                    <span className="text-sm font-semibold gold-text">{base.extraPrice > 0 ? `+ Rs. ${base.extraPrice}` : 'Included'}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => editBase(base.id)} className={smallOutlineBtn}>Edit</button>
                    <button onClick={() => setDeleteTarget({ section: 'bases', id: base.id, name: base.name })} className={smallDangerBtn}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
  };

  /* ---------- render: sizes block ---------- */

  const renderSizeBlock = () => {
    const rows = drafts.sizes;
    const saved = data.sizes;
    const isEditing = editing.sizes !== null;

    return (
      <div className="rounded-2xl border border-gold/15 bg-white/70 p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="font-display text-xl font-semibold">Bottle Sizes</h3>
            <p className="text-sm text-ink-soft italic">Available bottle size options</p>
          </div>
          <button onClick={addSizeDraft} className={addBtnCls}>
            + Add Size
          </button>
        </div>

        {rows.length > 0 && (
          <>
            <div className="space-y-3 mb-4">
              {rows.map((size, i) => (
                <div key={size.id} className="flex gap-3 items-end justify-between p-4 border border-gold/30 rounded-xl bg-sand/40">
                  <div className="flex gap-3 flex-1 flex-wrap">
                    <div className="w-24">
                      <label className={labelCls}>Label</label>
                      <input className={fieldCls} value={size.label} onChange={(e) => updateDraftRow('sizes', i, 'label', e.target.value)} placeholder="30 ml" />
                    </div>
                    <div className="w-24">
                      <label className={labelCls}>ML Value</label>
                      <input className={fieldCls} value={size.ml} onChange={(e) => updateDraftRow('sizes', i, 'ml', e.target.value)} placeholder="30ml" />
                    </div>
                    <div className="w-28">
                      <label className={labelCls}>Price (Rs.)</label>
                      <input type="number" min="0" className={fieldCls} value={size.price} onChange={(e) => updateDraftRow('sizes', i, 'price', Number(e.target.value))} placeholder="399" />
                    </div>
                    <div className="flex-2 min-w-50">
                      <label className={labelCls}>Description</label>
                      <input className={fieldCls} value={size.desc} onChange={(e) => updateDraftRow('sizes', i, 'desc', e.target.value)} placeholder="Samples & travel" />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeDraftRow('sizes', i)} className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors" title="Remove row">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-end gap-2">
              {renderSectionMessage('sizes')}
              <button onClick={saveSizes} className="btn-primary px-6 py-2.5 text-sm">
                {isEditing ? 'Update Size' : 'Save Sizes'}
              </button>
            </div>
          </>
        )}

        {renderSavedList(
          saved.length === 0 ? (
            emptyState('No saved sizes yet')
          ) : (
            <div className="space-y-2">
              {saved.map(size => (
                <div key={size.id} className="flex items-center justify-between gap-3 border border-gold/15 rounded-xl px-4 py-2.5 bg-cream/40">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium">{size.label}</span>
                    <span className="text-xs bg-gold/15 text-ink-soft px-2 py-0.5 rounded">{size.ml}</span>
                    <span className="text-sm text-ink-soft italic hidden sm:inline">{size.desc}</span>
                    <span className="text-sm font-semibold gold-text">Rs. {size.price}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => editSize(size.id)} className={smallOutlineBtn}>Edit</button>
                    <button onClick={() => setDeleteTarget({ section: 'sizes', id: size.id, name: size.label })} className={smallDangerBtn}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
  };

  /* ---------- render: settings ---------- */

  const renderSettings = () => (
    <div className="rounded-2xl border border-gold/15 bg-white/70 p-6">
      <h3 className="font-display text-xl font-semibold mb-4">General Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Max Notes Per Layer</label>
          <input
            type="number"
            min="1"
            max="10"
            className={fieldCls}
            value={data.maxNotesPerLayer}
            onChange={(e) => setData(prev => ({ ...prev, maxNotesPerLayer: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className={labelCls}>Delivery Fee (Rs.)</label>
          <input
            type="number"
            min="0"
            className={fieldCls}
            value={data.deliveryFee}
            onChange={(e) => setData(prev => ({ ...prev, deliveryFee: Number(e.target.value) }))}
          />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 mt-6">
        {renderSectionMessage('settings')}
        <button onClick={saveSettings} className="btn-primary px-6 py-2.5 text-sm">
          Save Settings
        </button>
      </div>
    </div>
  );

  /* ---------- main render ---------- */

  return (
    <div>
      <PageHeader
        title="Customization Settings"
        subtitle="Manage all content that displays on the /customize page"
      />

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 border-b border-gold/15 pb-4 flex-wrap">
        <button onClick={() => setActiveTab('notes')} className={tabBtnCls(activeTab === 'notes')}>
          🌸 Notes
        </button>
        <button onClick={() => setActiveTab('bases')} className={tabBtnCls(activeTab === 'bases')}>
          💧 Bases
        </button>
        <button onClick={() => setActiveTab('sizes')} className={tabBtnCls(activeTab === 'sizes')}>
          📏 Sizes
        </button>
        <button onClick={() => setActiveTab('settings')} className={tabBtnCls(activeTab === 'settings')}>
          ⚙️ Settings
        </button>
        <div className="ml-auto">
          <button onClick={resetAll} className="px-4 py-2 text-sm text-ink-soft hover:text-espresso border border-gold/20 rounded-lg transition-colors">
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Status message removed — now shown above each section's save button */}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          {(['topNotes', 'heartNotes', 'baseNotes'] as LayerKey[]).map(layer => renderNoteBlock(layer))}
        </div>
      )}

      {/* Bases Tab */}
      {activeTab === 'bases' && renderBaseBlock()}

      {/* Sizes Tab */}
      {activeTab === 'sizes' && renderSizeBlock()}

      {/* Settings Tab */}
      {activeTab === 'settings' && renderSettings()}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Item"
        message={
          <>
            Are you sure you want to delete <span className="font-medium text-ink">“{deleteTarget?.name}”</span>? This will remove it from the /customize page.
          </>
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) return;
          if ('layer' in deleteTarget) confirmDeleteNote();
          else if (deleteTarget.section === 'bases') confirmDeleteBase();
          else if (deleteTarget.section === 'sizes') confirmDeleteSize();
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Customization;