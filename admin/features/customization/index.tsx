import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { PageHeader, ConfirmDialog } from '../../components';
import { api } from '../../services/api';

interface Note {
  id: string;
  name: string;
  icon: string;
  color: string;
  price: number;
  description?: string;
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

interface BottleTypeOption {
  id: string;
  name: string;
  code: string;
  description: string;
  image: string;
  extraPrice: number;
}

interface CustomizationData {
  topNotes: Note[];
  heartNotes: Note[];
  baseNotes: Note[];
  bases: PaletteBase[];
  sizes: SizeOption[];
  bottleTypes: BottleTypeOption[];
  maxNotesPerLayer: number;
  deliveryFee: number;
}

type LayerKey = 'topNotes' | 'heartNotes' | 'baseNotes';
type TabKey = 'notes' | 'bases' | 'sizes' | 'bottletypes' | 'settings';
type SectionKey = LayerKey | 'bases' | 'sizes' | 'bottleTypes' | 'settings';

interface Message {
  kind: 'error' | 'info' | 'success';
  text: string;
  /** Sticky messages stay until the user edits a field, cancels, or saves. */
  sticky?: boolean;
}

interface Drafts {
  topNotes: Note[];
  heartNotes: Note[];
  baseNotes: Note[];
  bases: PaletteBase[];
  sizes: SizeOption[];
  bottleTypes: BottleTypeOption[];
}

const STORAGE_KEY = 'sugandhit_customization_data_v1';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Keeps prices as real numbers so blank/NaN input never corrupts the saved data. */
const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Compares two row lists by their user-visible content only (ignores ids). */
const sameContent = <T,>(a: T[], b: T[], content: (row: T) => unknown): boolean =>
  JSON.stringify(a.map(content)) === JSON.stringify(b.map(content));

const noteContent = (n: Note) => ({ name: n.name, icon: n.icon, color: n.color, price: toNumber(n.price) });
const baseContent = (b: PaletteBase) => ({ name: b.name, code: b.code, description: b.description, extraPrice: toNumber(b.extraPrice) });
const sizeContent = (s: SizeOption) => ({ label: s.label, ml: s.ml, price: toNumber(s.price), desc: s.desc });
const bottleTypeContent = (b: BottleTypeOption) => ({ name: b.name, code: b.code, description: b.description, image: b.image, extraPrice: toNumber(b.extraPrice) });

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
  bottleTypes: [
    { id: '1', name: 'Classic Clear Glass', code: 'classic', description: 'Timeless clear glass with a gold cap', image: 'https://unsplash.com/photos/IBY3ImxMilY/download?w=800&q=80', extraPrice: 0 },
    { id: '2', name: 'Matte Black', code: 'matte-black', description: 'Sleek, modern and understated', image: 'https://unsplash.com/photos/37EmTaUlAPs/download?w=800&q=80', extraPrice: 100 },
    { id: '3', name: 'Frosted Crystal', code: 'frosted', description: 'Soft-touch frosted glass with a subtle glow', image: 'https://unsplash.com/photos/QE2T4ttelQk/download?w=800&q=80', extraPrice: 150 },
    { id: '4', name: 'Vintage Amber', code: 'vintage-amber', description: 'Apothecary-inspired warm amber glass', image: 'https://unsplash.com/photos/gdUxNykbuZc/download?w=800&q=80', extraPrice: 200 },
    { id: '5', name: 'Faceted Crystal', code: 'faceted', description: 'Cut-crystal gem bottle, gift-worthy', image: 'https://unsplash.com/photos/8m4V_wPWwbY/download?w=800&q=80', extraPrice: 250 },
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
  bottleTypes: [],
};

/** Maps the admin's layer keys to the API layer slugs. */
const LAYER_API: Record<LayerKey, string> = { topNotes: 'top', heartNotes: 'heart', baseNotes: 'base' };

/* Server shapes returned by GET /api/note/palette and the PUT save endpoints. */
interface ServerNote { id: number; name: string; layer: string; icon: string; color: string; description: string; price: number; active: boolean; }
interface ServerBase { id: number; name: string; code: string; description: string; extraPrice: number; active: boolean; }
interface ServerSize { id: number; label: string; ml: string; price: number; desc: string; active: boolean; }
interface ServerBottleType { id: number; name: string; code: string; description: string; image: string; extraPrice: number; active: boolean; }
interface ServerSettings { maxNotesPerLayer: number; deliveryFee: number; }
interface PalettePayload {
  top: ServerNote[];
  heart: ServerNote[];
  base: ServerNote[];
  bases: ServerBase[];
  sizes: ServerSize[];
  bottleTypes: ServerBottleType[];
  settings: ServerSettings | null;
}

const noteFromServer = (n: ServerNote): Note => ({ id: String(n.id), name: n.name, icon: n.icon, color: n.color, price: toNumber(n.price), description: n.description });
const noteToServer = (n: Note) => ({ name: n.name, icon: n.icon, color: n.color, price: toNumber(n.price), description: n.description ?? '' });
const baseFromServer = (b: ServerBase): PaletteBase => ({ id: String(b.id), name: b.name, code: b.code, description: b.description, extraPrice: toNumber(b.extraPrice) });
const baseToServer = (b: PaletteBase) => ({ name: b.name, code: b.code, description: b.description, extraPrice: toNumber(b.extraPrice) });
const sizeFromServer = (s: ServerSize): SizeOption => ({ id: String(s.id), label: s.label, ml: s.ml, price: toNumber(s.price), desc: s.desc });
const sizeToServer = (s: SizeOption) => ({ label: s.label, ml: s.ml, price: toNumber(s.price), desc: s.desc });
const bottleTypeFromServer = (b: ServerBottleType): BottleTypeOption => ({ id: String(b.id), name: b.name, code: b.code, description: b.description, image: b.image ?? '', extraPrice: toNumber(b.extraPrice) });
const bottleTypeToServer = (b: BottleTypeOption) => ({ name: b.name, code: b.code, description: b.description, image: b.image ?? '', extraPrice: toNumber(b.extraPrice) });

const loadCustomizationData = (): CustomizationData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...clone(DEFAULT_DATA), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return clone(DEFAULT_DATA);
};

const Customization = ({ token }: { token: string }) => {
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
    bottleTypes: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<{ layer: LayerKey; id: string; name: string } | { section: 'bases' | 'sizes' | 'bottleTypes'; id: string; name: string } | null>(null);

  /* Load the live palette (notes + bases + sizes + settings) from the backend on mount. */
  useEffect(() => {
    let mounted = true;
    const loadFromServer = async () => {
      try {
        const res = await api<{ palette: PalettePayload }>('/api/note/palette', token);
        if (mounted && res?.palette) applyPalette(res.palette);
      } catch {
        /* Keep the localStorage defaults when the server is unreachable. */
      }
    };
    loadFromServer();
    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!message || message.sticky) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const notify = (section: SectionKey, kind: Message['kind'], text: string, msg?: string, sticky = false) => {
    setMessage({ section, kind, text, sticky });
    if (kind === 'error') toast.error(msg ?? text);
    else if (kind === 'info') toast.info(msg ?? text);
    else toast.success(msg ?? text);
  };

  /** Drops a sticky "nothing changed" notice as soon as the user touches a field. */
  const clearStickyMessage = (section: SectionKey) => {
    setMessage(prev => (prev && prev.section === section && prev.sticky ? null : prev));
  };

  const sectionMessage = (section: SectionKey): Message | null =>
    message && message.section === section
      ? { kind: message.kind, text: message.text, sticky: message.sticky }
      : null;

  const persist = (next: CustomizationData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  /** Replaces a single tab/section in state with server rows and persists the cache. */
  const applySection = (key: SectionKey, rows: Note[] | PaletteBase[] | SizeOption[] | BottleTypeOption[]) => {
    setData(prev => {
      const next = { ...prev, [key]: rows } as CustomizationData;
      persist(next);
      return next;
    });
  };

  /* ---------- server sync ---------- */

  const syncNotes = async (layer: LayerKey, rows: Note[]) => {
    try {
      const res = await api<{ notes: ServerNote[] }>(`/api/customization/notes/${LAYER_API[layer]}`, token, {
        method: 'PUT',
        body: { notes: rows.map(noteToServer) },
      });
      applySection(layer, (res?.notes || []).map(noteFromServer));
    } catch (error) {
      notify(layer, 'error', `Could not sync ${LAYER_META[layer].title}.`, (error as Error).message);
    }
  };

  const syncBases = async (rows: PaletteBase[]) => {
    try {
      const res = await api<{ bases: ServerBase[] }>('/api/customization/bases', token, {
        method: 'PUT',
        body: { bases: rows.map(baseToServer) },
      });
      applySection('bases', (res?.bases || []).map(baseFromServer));
    } catch (error) {
      notify('bases', 'error', 'Could not sync Perfume Bases.', (error as Error).message);
    }
  };

  const syncSizes = async (rows: SizeOption[]) => {
    try {
      const res = await api<{ sizes: ServerSize[] }>('/api/customization/sizes', token, {
        method: 'PUT',
        body: { sizes: rows.map(sizeToServer) },
      });
      applySection('sizes', (res?.sizes || []).map(sizeFromServer));
    } catch (error) {
      notify('sizes', 'error', 'Could not sync Bottle Sizes.', (error as Error).message);
    }
  };

  const syncBottleTypes = async (rows: BottleTypeOption[]) => {
    try {
      const res = await api<{ bottleTypes: ServerBottleType[] }>('/api/customization/bottletypes', token, {
        method: 'PUT',
        body: { bottleTypes: rows.map(bottleTypeToServer) },
      });
      applySection('bottleTypes', (res?.bottleTypes || []).map(bottleTypeFromServer));
    } catch (error) {
      notify('bottleTypes', 'error', 'Could not sync Bottle Types.', (error as Error).message);
    }
  };

  const syncSettings = async () => {
    try {
      await api('/api/customization/settings', token, {
        method: 'PUT',
        body: { maxNotesPerLayer: data.maxNotesPerLayer, deliveryFee: data.deliveryFee },
      });
    } catch (error) {
      notify('settings', 'error', 'Could not sync Settings.', (error as Error).message);
    }
  };

  /** Maps a palette payload onto the admin's local shape (used on mount & reset). */
  const applyPalette = (p: PalettePayload) => {
    const next: CustomizationData = {
      topNotes: (p.top || []).map(noteFromServer),
      heartNotes: (p.heart || []).map(noteFromServer),
      baseNotes: (p.base || []).map(noteFromServer),
      bases: (p.bases || []).map(baseFromServer),
      sizes: (p.sizes || []).map(sizeFromServer),
      bottleTypes: (p.bottleTypes || []).map(bottleTypeFromServer),
      maxNotesPerLayer: p.settings?.maxNotesPerLayer ?? DEFAULT_DATA.maxNotesPerLayer,
      deliveryFee: p.settings?.deliveryFee ?? DEFAULT_DATA.deliveryFee,
    };
    setData(next);
    persist(next);
  };

  /* ---------- generic draft helpers ---------- */

  const addDraft = <K extends keyof Drafts>(key: K, item: Drafts[K][number]) => {
    clearStickyMessage(key);
    setDrafts(prev => ({ ...prev, [key]: [...prev[key], item] }));
  };

  const updateDraftRow = <K extends keyof Drafts>(key: K, index: number, field: keyof Drafts[K][number], value: string | number) => {
    clearStickyMessage(key);
    setDrafts(prev => {
      const rows = [...prev[key]];
      const original = rows[index];
      rows[index] = { ...original, [field]: value };
      return { ...prev, [key]: rows };
    });
  };

  const removeDraftRow = <K extends keyof Drafts>(key: K, index: number) => {
    clearStickyMessage(key);
    setDrafts(prev => {
      const kept = (prev[key] as unknown as unknown[]).filter((_, i) => i !== index);
      // Removing the last row closes the editor, so drop the stale editing id too.
      if (kept.length === 0) setEditing(p => ({ ...p, [key]: null }));
      return { ...prev, [key]: kept };
    });
  };

  /** Closes the draft editor without saving (discards pending rows). */
  const cancelDrafts = <K extends keyof Drafts>(key: K) => {
    setDrafts(prev => ({ ...prev, [key]: [] }));
    setEditing(prev => ({ ...prev, [key]: null }));
    setMessage(null);
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
    const editIdx = editId ? rows.findIndex(n => n.id === editId) : -1;
    const nextNotes =
      editId && editIdx !== -1
        ? data[layer].map(n => (n.id === editId ? { ...n, ...rows[editIdx] } : n))
        : [...data[layer].filter(n => n.id !== editId), ...rows];
    if (sameContent(nextNotes, data[layer], noteContent)) {
      // Keep the editor open so the user can tweak the row or press Cancel.
      const text = editId ? 'Nothing changed to update.' : 'Nothing changed to save.';
      notify(layer, 'info', text, text, true);
      return;
    }
    const next = { ...data, [layer]: nextNotes };
    setData(next);
    persist(next);
    setDrafts(prev => ({ ...prev, [layer]: [] }));
    setEditing(prev => ({ ...prev, [layer]: null }));
    notify(layer, 'success', `${meta.title} saved.`);
    void syncNotes(layer, nextNotes);
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
    void syncNotes(layer, next[layer]);
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
    const editIdx = editId ? rows.findIndex(b => b.id === editId) : -1;
    const nextBases =
      editId && editIdx !== -1
        ? data.bases.map(b => (b.id === editId ? { ...b, ...rows[editIdx] } : b))
        : [...data.bases.filter(b => b.id !== editId), ...rows];
    if (sameContent(nextBases, data.bases, baseContent)) {
      // Keep the editor open so the user can tweak the row or press Cancel.
      const text = editId ? 'Nothing changed to update.' : 'Nothing changed to save.';
      notify('bases', 'info', text, text, true);
      return;
    }
    const next = { ...data, bases: nextBases };
    setData(next);
    persist(next);
    setDrafts(prev => ({ ...prev, bases: [] }));
    setEditing(prev => ({ ...prev, bases: null }));
    notify('bases', 'success', 'Perfume bases saved.');
    void syncBases(nextBases);
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
    void syncBases(next.bases);
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
    // When editing, patch the saved row in place so the list order never shifts.
    const editIdx = editId ? rows.findIndex(r => r.id === editId) : -1;
    const nextSizes =
      editId && editIdx !== -1
        ? data.sizes.map(s => (s.id === editId ? { ...s, ...rows[editIdx] } : s))
        : [...data.sizes, ...rows];
    if (sameContent(nextSizes, data.sizes, sizeContent)) {
      // Keep the editor open so the user can tweak the row or press Cancel.
      const text = editId ? 'Nothing changed to update.' : 'Nothing changed to save.';
      notify('sizes', 'info', text, text, true);
      return;
    }
    const next = { ...data, sizes: nextSizes };
    setData(next);
    persist(next);
    setDrafts(prev => ({ ...prev, sizes: [] }));
    setEditing(prev => ({ ...prev, sizes: null }));
    notify('sizes', 'success', 'Bottle sizes saved.');
    void syncSizes(nextSizes);
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
    void syncSizes(next.sizes);
  };

  const confirmDeleteSize = () => {
    if (!deleteTarget || !('section' in deleteTarget) || deleteTarget.section !== 'sizes') return;
    deleteSize(deleteTarget.id);
    setDeleteTarget(null);
  };

  /* ---------- Bottle Types ---------- */

  const addBottleTypeDraft = () =>
    addDraft('bottleTypes', { id: genId(), name: '', code: '', description: '', image: '', extraPrice: 0 });

  const saveBottleTypes = () => {
    const rows = drafts.bottleTypes;
    if (rows.length === 0) {
      notify('bottleTypes', 'info', 'Nothing changed to save.', 'Nothing changed to save');
      return;
    }
    const blankNameIdx = rows.findIndex(b => !b.name.trim());
    if (blankNameIdx !== -1) {
      notify('bottleTypes', 'error', `Bottle Type #${blankNameIdx + 1} name is required.`, 'Field required');
      return;
    }
    const blankCodeIdx = rows.findIndex(b => !b.code.trim());
    if (blankCodeIdx !== -1) {
      notify('bottleTypes', 'error', `Bottle Type #${blankCodeIdx + 1} code is required.`, 'Field required');
      return;
    }
    const badImageIdx = rows.findIndex(b => b.image.trim() && !/^https?:\/\//i.test(b.image.trim()));
    if (badImageIdx !== -1) {
      notify('bottleTypes', 'error', `Bottle Type #${badImageIdx + 1} image must be a valid http(s) URL.`, 'Invalid image URL');
      return;
    }
    const editId = editing.bottleTypes;
    const editIdx = editId ? rows.findIndex(b => b.id === editId) : -1;
    const nextBottleTypes =
      editId && editIdx !== -1
        ? data.bottleTypes.map(b => (b.id === editId ? { ...b, ...rows[editIdx] } : b))
        : [...data.bottleTypes.filter(b => b.id !== editId), ...rows];
    if (sameContent(nextBottleTypes, data.bottleTypes, bottleTypeContent)) {
      // Keep the editor open so the user can tweak the row or press Cancel.
      const text = editId ? 'Nothing changed to update.' : 'Nothing changed to save.';
      notify('bottleTypes', 'info', text, text, true);
      return;
    }
    const next = { ...data, bottleTypes: nextBottleTypes };
    setData(next);
    persist(next);
    setDrafts(prev => ({ ...prev, bottleTypes: [] }));
    setEditing(prev => ({ ...prev, bottleTypes: null }));
    notify('bottleTypes', 'success', 'Bottle types saved.');
    void syncBottleTypes(nextBottleTypes);
  };

  const editBottleType = (id: string) => {
    const item = data.bottleTypes.find(b => b.id === id);
    if (!item) return;
    setEditing(prev => ({ ...prev, bottleTypes: id }));
    setDrafts(prev => ({ ...prev, bottleTypes: [clone(item)] }));
    setMessage(null);
  };

  const deleteBottleType = (id: string) => {
    const next = { ...data, bottleTypes: data.bottleTypes.filter(b => b.id !== id) };
    setData(next);
    persist(next);
    setEditing(prev => (prev.bottleTypes === id ? { ...prev, bottleTypes: null } : prev));
    if (editing.bottleTypes === id) setDrafts(prev => ({ ...prev, bottleTypes: [] }));
    notify('bottleTypes', 'success', 'Bottle type deleted.');
    void syncBottleTypes(next.bottleTypes);
  };

  const confirmDeleteBottleType = () => {
    if (!deleteTarget || !('section' in deleteTarget) || deleteTarget.section !== 'bottleTypes') return;
    deleteBottleType(deleteTarget.id);
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
    void syncSettings();
  };

  const resetAll = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setDrafts(clone(EMPTY_DRAFTS));
    setEditing({ topNotes: null, heartNotes: null, baseNotes: null, bases: null, sizes: null, bottleTypes: null });
    setMessage(null);
    try {
      const res = await api<{ palette: PalettePayload }>('/api/note/palette', token);
      if (res?.palette) {
        applyPalette(res.palette);
        toast.success('Customization reset to server defaults.');
        return;
      }
    } catch {
      /* fall through to local defaults */
    }
    setData(clone(DEFAULT_DATA));
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
                      <input type="number" min="0" className={fieldCls} value={note.price === 0 ? '' : note.price} onChange={(e) => updateDraftRow(layer, i, 'price', toNumber(e.target.value))} placeholder="0" />
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
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => cancelDrafts(layer)} className={smallOutlineBtn}>
                  Cancel
                </button>
                <button onClick={() => saveNotes(layer)} className="btn-primary px-6 py-2.5 text-sm">
                  {isEditing ? 'Update Notes' : 'Save Notes'}
                </button>
              </div>
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
                    <span className="text-sm text-ink-soft">Rs. {note.price}</span>
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
                      <input type="number" min="0" className={fieldCls} value={base.extraPrice} onChange={(e) => updateDraftRow('bases', i, 'extraPrice', toNumber(e.target.value))} placeholder="0" />
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
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => cancelDrafts('bases')} className={smallOutlineBtn}>
                  Cancel
                </button>
                <button onClick={saveBases} className="btn-primary px-6 py-2.5 text-sm">
                  {isEditing ? 'Update Base' : 'Save Bases'}
                </button>
              </div>
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
                      <input type="number" min="0" className={fieldCls} value={size.price} onChange={(e) => updateDraftRow('sizes', i, 'price', toNumber(e.target.value))} placeholder="399" />
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
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => cancelDrafts('sizes')} className={smallOutlineBtn}>
                  Cancel
                </button>
                <button onClick={saveSizes} className="btn-primary px-6 py-2.5 text-sm">
                  {isEditing ? 'Update Size' : 'Save Sizes'}
                </button>
              </div>
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

  /* ---------- render: bottle types block ---------- */

  const renderBottleTypeBlock = () => {
    const rows = drafts.bottleTypes;
    const saved = data.bottleTypes;
    const isEditing = editing.bottleTypes !== null;

    return (
      <div className="rounded-2xl border border-gold/15 bg-white/70 p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="font-display text-xl font-semibold">Bottle Types</h3>
            <p className="text-sm text-ink-soft italic">The glass your blend is poured into — shown with an image on /customize</p>
          </div>
          <button onClick={addBottleTypeDraft} className={addBtnCls}>
            + Add Bottle Type
          </button>
        </div>

        {rows.length > 0 && (
          <>
            <div className="space-y-3 mb-4">
              {rows.map((type, i) => (
                <div key={type.id} className="flex gap-3 items-end justify-between p-4 border border-gold/30 rounded-xl bg-sand/40">
                  <div className="flex gap-3 flex-1 flex-wrap items-end">
                    <div className="w-24 shrink-0">
                      <label className={labelCls}>Image</label>
                      {type.image ? (
                        <img
                          src={type.image}
                          alt={type.name || 'Bottle type'}
                          className="w-24 h-24 object-cover rounded-xl border border-gold/20 bg-cream/50"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl border border-dashed border-gold/30 bg-cream/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-35">
                      <label className={labelCls}>Name</label>
                      <input className={fieldCls} value={type.name} onChange={(e) => updateDraftRow('bottleTypes', i, 'name', e.target.value)} placeholder="Classic Clear Glass" />
                    </div>
                    <div className="flex-1 min-w-30">
                      <label className={labelCls}>Code</label>
                      <input className={fieldCls} value={type.code} onChange={(e) => updateDraftRow('bottleTypes', i, 'code', e.target.value)} placeholder="classic" />
                    </div>
                    <div className="w-28 shrink-0">
                      <label className={labelCls}>Extra Price (Rs.)</label>
                      <input type="number" min="0" className={fieldCls} value={type.extraPrice} onChange={(e) => updateDraftRow('bottleTypes', i, 'extraPrice', toNumber(e.target.value))} placeholder="0" />
                    </div>
                    <div className="flex-2 min-w-50">
                      <label className={labelCls}>Description</label>
                      <input className={fieldCls} value={type.description} onChange={(e) => updateDraftRow('bottleTypes', i, 'description', e.target.value)} placeholder="Timeless clear glass" />
                    </div>
                    <div className="flex-2 min-w-60">
                      <label className={labelCls}>Image URL</label>
                      <input className={fieldCls} value={type.image} onChange={(e) => updateDraftRow('bottleTypes', i, 'image', e.target.value)} placeholder="https://…" />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeDraftRow('bottleTypes', i)} className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors" title="Remove row">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-end gap-2">
              {renderSectionMessage('bottleTypes')}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => cancelDrafts('bottleTypes')} className={smallOutlineBtn}>
                  Cancel
                </button>
                <button onClick={saveBottleTypes} className="btn-primary px-6 py-2.5 text-sm">
                  {isEditing ? 'Update Bottle Type' : 'Save Bottle Types'}
                </button>
              </div>
            </div>
          </>
        )}

        {renderSavedList(
          saved.length === 0 ? (
            emptyState('No saved bottle types yet')
          ) : (
            <div className="space-y-2">
              {saved.map(type => (
                <div key={type.id} className="flex items-center justify-between gap-3 border border-gold/15 rounded-xl px-4 py-2.5 bg-cream/40">
                  <div className="flex items-center gap-3 flex-wrap">
                    {type.image
                      ? <img src={type.image} alt={type.name} className="w-10 h-10 rounded-lg object-cover border border-gold/20 shrink-0" />
                      : <span className="w-10 h-10 rounded-lg border border-dashed border-gold/30 shrink-0" />}
                    <span className="font-medium">{type.name}</span>
                    <span className="text-xs bg-gold/15 text-ink-soft px-2 py-0.5 rounded">{type.code}</span>
                    <span className="text-sm text-ink-soft italic hidden sm:inline">{type.description}</span>
                    <span className="text-sm font-semibold gold-text">{type.extraPrice > 0 ? `+ Rs. ${type.extraPrice}` : 'Included'}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => editBottleType(type.id)} className={smallOutlineBtn}>Edit</button>
                    <button onClick={() => setDeleteTarget({ section: 'bottleTypes', id: type.id, name: type.name })} className={smallDangerBtn}>Delete</button>
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
        <button onClick={() => setActiveTab('bottletypes')} className={tabBtnCls(activeTab === 'bottletypes')}>
          🧴 Bottle Types
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

      {/* Bottle Types Tab */}
      {activeTab === 'bottletypes' && renderBottleTypeBlock()}

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
          else if (deleteTarget.section === 'bottleTypes') confirmDeleteBottleType();
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Customization;