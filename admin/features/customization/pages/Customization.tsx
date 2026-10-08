import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '@/components/data-display/PageHeader';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import FormErrors from '@/components/feedback/FormErrors';
import Loading from '@/components/feedback/Loading';
import { api } from '@/services/api';
import RowActions from '@/components/data-display/RowActions';
import ImagePreview from '@/components/data-display/ImagePreview';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import RequiredMark from '@/components/ui/RequiredMark';
import { matches } from '@/utils';
import { useTabParam } from '@/hooks/useTabParam';
import { useFormErrors } from '@/hooks/useFormErrors';
import ViewItemModal from '@/features/customization/components/ViewItemModal';
import ItemFormModal from '@/features/customization/components/ItemFormModal';
import type { ItemFormTarget, ItemTarget } from '@/features/customization/customization.types';
import { DEFAULT_NOTE_COLOR } from '@/features/customization/customization.service';

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
/** Content blocks (each with its own saved-items search + pagination). */
type BlockKey = LayerKey | 'bases' | 'sizes' | 'bottleTypes';

const TAB_KEYS: TabKey[] = ['notes', 'bases', 'sizes', 'bottletypes', 'settings'];

interface Message {
  kind: 'error' | 'info' | 'success';
  text: string;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

/** Keeps prices as real numbers so blank/NaN input never corrupts the saved data. */
const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Empty starting state. The backend is the single source of truth for this page — nothing
 * is seeded in the client, so an unreachable server shows empty lists (never fake rows).
 */
const EMPTY_DATA: CustomizationData = {
  topNotes: [],
  heartNotes: [],
  baseNotes: [],
  bases: [],
  sizes: [],
  bottleTypes: [],
  maxNotesPerLayer: 0,
  deliveryFee: 0,
};

const LAYER_META: Record<LayerKey, { title: string; sub: string }> = {
  topNotes: { title: 'Top Notes', sub: 'The first impression — bright & fleeting' },
  heartNotes: { title: 'Heart Notes', sub: 'The soul — blooms in the middle' },
  baseNotes: { title: 'Base Notes', sub: 'The memory — lingers on skin' },
};

/** Maps the admin's layer keys to the API layer slugs. */
const LAYER_API: Record<LayerKey, string> = { topNotes: 'top', heartNotes: 'heart', baseNotes: 'base' };

/** Saved items shown per page inside each customization block. */
const PAGE_SIZE = 20;

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

/** Notes saved without a color fall back to white everywhere the field is read or written. */
const noteFromServer = (n: ServerNote): Note => ({ id: String(n.id), name: n.name, icon: n.icon, color: n.color || DEFAULT_NOTE_COLOR, price: toNumber(n.price), description: n.description });
const noteToServer = (n: Note) => ({ name: n.name, icon: n.icon, color: n.color.trim() || DEFAULT_NOTE_COLOR, price: toNumber(n.price), description: n.description ?? '' });
const baseFromServer = (b: ServerBase): PaletteBase => ({ id: String(b.id), name: b.name, code: b.code, description: b.description, extraPrice: toNumber(b.extraPrice) });
const baseToServer = (b: PaletteBase) => ({ name: b.name, code: b.code, description: b.description, extraPrice: toNumber(b.extraPrice) });
const sizeFromServer = (s: ServerSize): SizeOption => ({ id: String(s.id), label: s.label, ml: s.ml, price: toNumber(s.price), desc: s.desc });
const sizeToServer = (s: SizeOption) => ({ label: s.label, ml: s.ml, price: toNumber(s.price), desc: s.desc });
const bottleTypeFromServer = (b: ServerBottleType): BottleTypeOption => ({ id: String(b.id), name: b.name, code: b.code, description: b.description, image: b.image ?? '', extraPrice: toNumber(b.extraPrice) });
const bottleTypeToServer = (b: BottleTypeOption) => ({ name: b.name, code: b.code, description: b.description, image: b.image ?? '', extraPrice: toNumber(b.extraPrice) });

const Customization = ({ token }: { token: string }) => {
  const [data, setData] = useState<CustomizationData>(clone(EMPTY_DATA));
  const [activeTab, setActiveTab] = useTabParam('tab', TAB_KEYS, 'notes');
  const [message, setMessage] = useState<{ section: SectionKey } & Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Bumped to re-run the mount fetch (used by the Retry button). */
  const [reloadKey, setReloadKey] = useState(0);
  /** Last settings the server confirmed, so "nothing changed" can be judged without local storage. */
  const [savedSettings, setSavedSettings] = useState<ServerSettings | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ layer: LayerKey; id: string; name: string } | { section: 'bases' | 'sizes' | 'bottleTypes'; id: string; name: string } | null>(null);
  /** Saved row opened in the View modal — the eye action from the /list rows. */
  const [viewTarget, setViewTarget] = useState<ItemTarget | null>(null);
  /** Section open in the form modal — the pencil (edit) and the "+ Add" buttons both use it. */
  const [formTarget, setFormTarget] = useState<ItemFormTarget | null>(null);

  /** Free-text search over each block's saved items. */
  const [savedSearch, setSavedSearch] = useState<Record<BlockKey, string>>({
    topNotes: '',
    heartNotes: '',
    baseNotes: '',
    bases: '',
    sizes: '',
    bottleTypes: '',
  });

  /** Current page per block for its saved-items list (bounds are clamped on render). */
  const [savedPages, setSavedPages] = useState<Record<string, number>>({});

  /* Load the live palette (notes + bases + sizes + settings) from the backend on mount. */
  useEffect(() => {
    let mounted = true;
    const loadFromServer = async () => {
      setLoading(true);
      try {
        const res = await api<{ palette: PalettePayload }>('/api/note/palette', token);
        if (!mounted) return;
        if (res?.palette) {
          applyPalette(res.palette);
          setLoadError(null);
        } else {
          setLoadError('Server returned no customization data.');
        }
      } catch (error) {
        if (mounted) setLoadError((error as Error).message || 'Could not load customization data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadFromServer();
    return () => {
      mounted = false;
    };
  }, [token, reloadKey]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

  /** Settings-tab submit validation: lists every reason above Save + toasts them. */
  const { errors, validate, clearErrors } = useFormErrors();

  const notify = (section: SectionKey, kind: Message['kind'], text: string, msg?: string) => {
    setMessage({ section, kind, text });
    if (kind === 'error') toast.error(msg ?? text);
    else if (kind === 'info') toast.info(msg ?? text);
    else toast.success(msg ?? text);
  };

  const sectionMessage = (section: SectionKey): Message | null =>
    message && message.section === section ? { kind: message.kind, text: message.text } : null;

  /** Replaces a single tab/section in state with the rows the server just confirmed. */
  const applySection = (key: SectionKey, rows: Note[] | PaletteBase[] | SizeOption[] | BottleTypeOption[]) => {
    setData(prev => ({ ...prev, [key]: rows }) as CustomizationData);
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
    const next: ServerSettings = { maxNotesPerLayer: data.maxNotesPerLayer, deliveryFee: data.deliveryFee };
    try {
      const res = await api<{ settings: ServerSettings | null }>('/api/customization/settings', token, {
        method: 'PUT',
        body: next,
      });
      setSavedSettings(res?.settings ?? next);
    } catch (error) {
      notify('settings', 'error', 'Could not sync Settings.', (error as Error).message);
    }
  };

  /**
   * Applies a row from the form modal — a new row (id not in the section yet)
   * is appended, an existing one is merged in place — then re-syncs the section.
   */
  const applyForm = (updated: ItemTarget) => {
    setFormTarget(null);
    // Positive single-literal checks first; the multi-literal note variant is
    // the remainder (TS won't narrow it away through an || chain).
    if (updated.section === 'bases') {
      const exists = data.bases.some(b => b.id === updated.item.id);
      const next = exists ? data.bases.map(b => (b.id === updated.item.id ? updated.item : b)) : [...data.bases, updated.item];
      setData(prev => ({ ...prev, bases: next }));
      notify('bases', 'success', exists ? 'Perfume base updated.' : 'Perfume base added.');
      void syncBases(next);
    } else if (updated.section === 'sizes') {
      const exists = data.sizes.some(s => s.id === updated.item.id);
      const next = exists ? data.sizes.map(s => (s.id === updated.item.id ? updated.item : s)) : [...data.sizes, updated.item];
      setData(prev => ({ ...prev, sizes: next }));
      notify('sizes', 'success', exists ? 'Bottle size updated.' : 'Bottle size added.');
      void syncSizes(next);
    } else if (updated.section === 'bottleTypes') {
      const exists = data.bottleTypes.some(b => b.id === updated.item.id);
      const next = exists ? data.bottleTypes.map(b => (b.id === updated.item.id ? updated.item : b)) : [...data.bottleTypes, updated.item];
      setData(prev => ({ ...prev, bottleTypes: next }));
      notify('bottleTypes', 'success', exists ? 'Bottle type updated.' : 'Bottle type added.');
      void syncBottleTypes(next);
    } else {
      const layer = updated.section;
      const exists = data[layer].some(n => n.id === updated.item.id);
      const next = exists ? data[layer].map(n => (n.id === updated.item.id ? updated.item : n)) : [...data[layer], updated.item];
      setData(prev => ({ ...prev, [layer]: next }));
      notify(layer, 'success', exists ? 'Note updated.' : 'Note added.');
      void syncNotes(layer, next);
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
      maxNotesPerLayer: p.settings?.maxNotesPerLayer ?? 0,
      deliveryFee: p.settings?.deliveryFee ?? 0,
    };
    setData(next);
    setSavedSettings(p.settings ? { maxNotesPerLayer: next.maxNotesPerLayer, deliveryFee: next.deliveryFee } : null);
  };

  /* ---------- Notes ---------- */

  const deleteNote = (layer: LayerKey, id: string) => {
    const next = { ...data, [layer]: data[layer].filter(n => n.id !== id) };
    setData(next);
    notify(layer, 'success', 'Note deleted.');
    void syncNotes(layer, next[layer]);
  };

  const confirmDeleteNote = () => {
    if (!deleteTarget || !('layer' in deleteTarget)) return;
    deleteNote(deleteTarget.layer, deleteTarget.id);
    setDeleteTarget(null);
  };

  /* ---------- Bases ---------- */

  const deleteBase = (id: string) => {
    const next = { ...data, bases: data.bases.filter(b => b.id !== id) };
    setData(next);
    notify('bases', 'success', 'Base deleted.');
    void syncBases(next.bases);
  };

  const confirmDeleteBase = () => {
    if (!deleteTarget || !('section' in deleteTarget) || deleteTarget.section !== 'bases') return;
    deleteBase(deleteTarget.id);
    setDeleteTarget(null);
  };

  /* ---------- Sizes ---------- */

  const deleteSize = (id: string) => {
    const next = { ...data, sizes: data.sizes.filter(s => s.id !== id) };
    setData(next);
    notify('sizes', 'success', 'Size deleted.');
    void syncSizes(next.sizes);
  };

  const confirmDeleteSize = () => {
    if (!deleteTarget || !('section' in deleteTarget) || deleteTarget.section !== 'sizes') return;
    deleteSize(deleteTarget.id);
    setDeleteTarget(null);
  };

  /* ---------- Bottle Types ---------- */

  const deleteBottleType = (id: string) => {
    const next = { ...data, bottleTypes: data.bottleTypes.filter(b => b.id !== id) };
    setData(next);
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
    if (
      !validate([
        (!data.maxNotesPerLayer || data.maxNotesPerLayer < 1) && 'Max Notes Per Layer is required (min 1).',
      ])
    ) {
      return;
    }
    if (savedSettings && savedSettings.maxNotesPerLayer === data.maxNotesPerLayer && savedSettings.deliveryFee === data.deliveryFee) {
      notify('settings', 'info', 'Nothing changed to save.', 'Nothing changed to save');
      return;
    }
    notify('settings', 'success', 'Settings saved.');
    void syncSettings();
  };

  /** Re-reads the palette from the server; "defaults" always means the server's current rows. */
  const resetAll = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const res = await api<{ palette: PalettePayload }>('/api/note/palette', token);
      if (res?.palette) {
        applyPalette(res.palette);
        setLoadError(null);
        toast.success('Customization reloaded from the server.');
        return;
      }
      setLoadError('Server returned no customization data.');
      toast.error('Server returned no customization data.');
    } catch (error) {
      const msg = (error as Error).message || 'Could not load customization data.';
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI helpers ---------- */

  const fieldCls = 'w-full rounded-xl border border-gold/20 bg-cream/50 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold';
  const labelCls = 'mb-1.5 block text-sm text-ink-soft font-medium';
  const tabBtnCls = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-gold text-cream' : 'bg-gold/10 text-ink hover:bg-gold/20'}`;
  const addBtnCls = 'px-4 py-2 bg-gold text-cream rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors';

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
    const saved = data[layer];
    const visible = saved.filter((note) => matches(savedSearch[layer], note.name, note.icon, note.description));
    const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const safePage = Math.min(savedPages[layer] || 1, totalPages);
    const pageVisible = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return (
      <div key={layer} className="rounded-2xl border border-gold/15 bg-white/70 p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="font-display text-xl font-semibold">{meta.title}</h3>
            <p className="text-sm text-ink-soft italic">{meta.sub}</p>
          </div>
          <button onClick={() => setFormTarget({ section: layer, item: null })} className={addBtnCls}>
            + Add Note
          </button>
        </div>

        {/* Saved list */}
        {renderSavedList(
          <>
            <SearchInput
              value={savedSearch[layer]}
              onChange={(v) => setSavedSearch(prev => ({ ...prev, [layer]: v }))}
              placeholder={`Search ${meta.title.toLowerCase()}…`}
              className="mb-3 w-full sm:w-72"
            />
            {saved.length === 0 ? (
              emptyState('No saved notes yet')
            ) : visible.length === 0 ? (
              emptyState('No notes match your search.')
            ) : (
              <>
              <div className="space-y-2">
                {pageVisible.map(note => (
                  <div key={note.id} className="flex items-center justify-between gap-3 border border-gold/15 rounded-xl px-4 py-2.5 bg-cream/40">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Hairline border keeps a white swatch visible against the light card. */}
                      <span className="inline-block w-3 h-3 rounded-full shrink-0 border border-gold/30" style={{ background: note.color }} />
                      <span className="text-lg">{note.icon}</span>
                      <span className="font-medium">{note.name}</span>
                      <span className="text-sm text-ink-soft">Rs. {note.price}</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <RowActions
                        onView={() => setViewTarget({ section: layer, item: note })}
                        onEdit={() => setFormTarget({ section: layer, item: note })}
                        onDelete={() => setDeleteTarget({ layer, id: note.id, name: note.name })}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Pagination total={visible.length} perPage={PAGE_SIZE} page={safePage} onPage={(p) => setSavedPages(prev => ({ ...prev, [layer]: p }))} label={`${meta.title} notes`} />
              </>
            )}
          </>
        )}
      </div>
    );
  };

  /* ---------- render: bases block ---------- */

  const renderBaseBlock = () => {
    const saved = data.bases;
    const visible = saved.filter((base) => matches(savedSearch.bases, base.name, base.code, base.description));
    const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const safePage = Math.min(savedPages.bases || 1, totalPages);
    const pageVisible = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return (
      <div className="rounded-2xl border border-gold/15 bg-white/70 p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="font-display text-xl font-semibold">Perfume Bases</h3>
            <p className="text-sm text-ink-soft italic">Different perfume concentrations and options</p>
          </div>
          <button onClick={() => setFormTarget({ section: 'bases', item: null })} className={addBtnCls}>
            + Add Base
          </button>
        </div>

        {renderSavedList(
          <>
            <SearchInput
              value={savedSearch.bases}
              onChange={(v) => setSavedSearch(prev => ({ ...prev, bases: v }))}
              placeholder="Search bases…"
              className="mb-3 w-full sm:w-72"
            />
            {saved.length === 0 ? (
              emptyState('No saved bases yet')
            ) : visible.length === 0 ? (
              emptyState('No bases match your search.')
            ) : (
              <>
              <div className="space-y-2">
                {pageVisible.map(base => (
                  <div key={base.id} className="flex items-center justify-between gap-3 border border-gold/15 rounded-xl px-4 py-2.5 bg-cream/40">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium">{base.name}</span>
                      <span className="text-xs bg-gold/15 text-ink-soft px-2 py-0.5 rounded">{base.code}</span>
                      <span className="text-sm text-ink-soft italic hidden sm:inline">{base.description}</span>
                      <span className="text-sm font-semibold gold-text">{base.extraPrice > 0 ? `+ Rs. ${base.extraPrice}` : 'Included'}</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <RowActions
                        onView={() => setViewTarget({ section: 'bases', item: base })}
                        onEdit={() => setFormTarget({ section: 'bases', item: base })}
                        onDelete={() => setDeleteTarget({ section: 'bases', id: base.id, name: base.name })}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Pagination total={visible.length} perPage={PAGE_SIZE} page={safePage} onPage={(p) => setSavedPages(prev => ({ ...prev, bases: p }))} label="Bases" />
              </>
            )}
          </>
        )}
      </div>
    );
  };

  /* ---------- render: sizes block ---------- */

  const renderSizeBlock = () => {
    const saved = data.sizes;
    const visible = saved.filter((size) => matches(savedSearch.sizes, size.label, size.ml, size.desc));
    const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const safePage = Math.min(savedPages.sizes || 1, totalPages);
    const pageVisible = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return (
      <div className="rounded-2xl border border-gold/15 bg-white/70 p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="font-display text-xl font-semibold">Bottle Sizes</h3>
            <p className="text-sm text-ink-soft italic">Available bottle size options</p>
          </div>
          <button onClick={() => setFormTarget({ section: 'sizes', item: null })} className={addBtnCls}>
            + Add Size
          </button>
        </div>

        {renderSavedList(
          <>
            <SearchInput
              value={savedSearch.sizes}
              onChange={(v) => setSavedSearch(prev => ({ ...prev, sizes: v }))}
              placeholder="Search sizes…"
              className="mb-3 w-full sm:w-72"
            />
            {saved.length === 0 ? (
              emptyState('No saved sizes yet')
            ) : visible.length === 0 ? (
              emptyState('No sizes match your search.')
            ) : (
              <>
              <div className="space-y-2">
                {pageVisible.map(size => (
                  <div key={size.id} className="flex items-center justify-between gap-3 border border-gold/15 rounded-xl px-4 py-2.5 bg-cream/40">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium">{size.label}</span>
                      <span className="text-xs bg-gold/15 text-ink-soft px-2 py-0.5 rounded">{size.ml}</span>
                      <span className="text-sm text-ink-soft italic hidden sm:inline">{size.desc}</span>
                      <span className="text-sm font-semibold gold-text">Rs. {size.price}</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <RowActions
                        onView={() => setViewTarget({ section: 'sizes', item: size })}
                        onEdit={() => setFormTarget({ section: 'sizes', item: size })}
                        onDelete={() => setDeleteTarget({ section: 'sizes', id: size.id, name: size.label })}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Pagination total={visible.length} perPage={PAGE_SIZE} page={safePage} onPage={(p) => setSavedPages(prev => ({ ...prev, sizes: p }))} label="Sizes" />
              </>
            )}
          </>
        )}
      </div>
    );
  };

  /* ---------- render: bottle types block ---------- */

  const renderBottleTypeBlock = () => {
    const saved = data.bottleTypes;
    const visible = saved.filter((type) => matches(savedSearch.bottleTypes, type.name, type.code, type.description));
    const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const safePage = Math.min(savedPages.bottleTypes || 1, totalPages);
    const pageVisible = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return (
      <div className="rounded-2xl border border-gold/15 bg-white/70 p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="font-display text-xl font-semibold">Bottle Types</h3>
            <p className="text-sm text-ink-soft italic">The glass your blend is poured into — shown with an image on /customize</p>
          </div>
          <button onClick={() => setFormTarget({ section: 'bottleTypes', item: null })} className={addBtnCls}>
            + Add Bottle Type
          </button>
        </div>

        {renderSavedList(
          <>
            <SearchInput
              value={savedSearch.bottleTypes}
              onChange={(v) => setSavedSearch(prev => ({ ...prev, bottleTypes: v }))}
              placeholder="Search bottle types…"
              className="mb-3 w-full sm:w-72"
            />
            {saved.length === 0 ? (
              emptyState('No saved bottle types yet')
            ) : visible.length === 0 ? (
              emptyState('No bottle types match your search.')
            ) : (
              <>
              <div className="space-y-2">
                {pageVisible.map(type => (
                  <div key={type.id} className="flex items-center justify-between gap-3 border border-gold/15 rounded-xl px-4 py-2.5 bg-cream/40">
                    <div className="flex items-center gap-3 flex-wrap">
                      {type.image
                        ? <ImagePreview src={type.image} alt={type.name} className="w-10 h-10 rounded-lg object-cover border border-gold/20 shrink-0" errorClassName="w-10 h-10 rounded-lg border border-dashed border-red-300 bg-red-50/60 text-red-500 flex items-center justify-center shrink-0 text-sm" />
                        : <span className="w-10 h-10 rounded-lg border border-dashed border-gold/30 shrink-0" />}
                      <span className="font-medium">{type.name}</span>
                      <span className="text-xs bg-gold/15 text-ink-soft px-2 py-0.5 rounded">{type.code}</span>
                      <span className="text-sm text-ink-soft italic hidden sm:inline">{type.description}</span>
                      <span className="text-sm font-semibold gold-text">{type.extraPrice > 0 ? `+ Rs. ${type.extraPrice}` : 'Included'}</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <RowActions
                        onView={() => setViewTarget({ section: 'bottleTypes', item: type })}
                        onEdit={() => setFormTarget({ section: 'bottleTypes', item: type })}
                        onDelete={() => setDeleteTarget({ section: 'bottleTypes', id: type.id, name: type.name })}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Pagination total={visible.length} perPage={PAGE_SIZE} page={safePage} onPage={(p) => setSavedPages(prev => ({ ...prev, bottleTypes: p }))} label="Bottle types" />
              </>
            )}
          </>
        )}
      </div>
    );
  };

  /* ---------- render: settings ---------- */

  const renderSettings = () => (
    <div className="rounded-2xl border border-gold/15 bg-white/70 p-6" onChangeCapture={clearErrors}>
      <h3 className="font-display text-xl font-semibold mb-4">General Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Max Notes Per Layer<RequiredMark /></label>
          <input
            type="number"
            min="1"
            max="10"
            className={fieldCls}
            value={data.maxNotesPerLayer || ''}
            onChange={(e) => setData(prev => ({ ...prev, maxNotesPerLayer: toNumber(e.target.value) }))}
          />
        </div>
        <div>
          <label className={labelCls}>Delivery Fee (Rs.)</label>
          <input
            type="number"
            min="0"
            className={fieldCls}
            value={data.deliveryFee || ''}
            onChange={(e) => setData(prev => ({ ...prev, deliveryFee: toNumber(e.target.value) }))}
          />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 mt-6">
        {renderSectionMessage('settings')}
        <FormErrors errors={errors} />
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
          <button
            onClick={resetAll}
            disabled={loading}
            className="px-4 py-2 text-sm text-ink-soft hover:text-espresso border border-gold/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Reloading…' : 'Reload from Server'}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium border bg-red-50 text-red-600 border-red-200 flex items-center justify-between gap-4">
          <span>Could not load customization data from the server: {loadError}</span>
          <button onClick={() => setReloadKey(k => k + 1)} className="shrink-0 px-3 py-1.5 text-sm border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
            Retry
          </button>
        </div>
      )}

      {loading && !loadError && (
        <Loading className="w-55 md:w-100" label="Loading customization data" />
      )}

      {/* Notes Tab */}
      {!loading && activeTab === 'notes' && (
        <div className="space-y-6">
          {(['topNotes', 'heartNotes', 'baseNotes'] as LayerKey[]).map(layer => renderNoteBlock(layer))}
        </div>
      )}

      {/* Bases Tab */}
      {!loading && activeTab === 'bases' && renderBaseBlock()}

      {/* Sizes Tab */}
      {!loading && activeTab === 'sizes' && renderSizeBlock()}

      {/* Bottle Types Tab */}
      {!loading && activeTab === 'bottletypes' && renderBottleTypeBlock()}

      {/* Settings Tab */}
      {!loading && activeTab === 'settings' && renderSettings()}

      {/* View details — the eye action, same idea as the /list rows */}
      <ViewItemModal target={viewTarget} onClose={() => setViewTarget(null)} />

      {/* Add/Edit — one popup form shared by the "+ Add" buttons and the pencil action */}
      {formTarget && (
        <ItemFormModal token={token} target={formTarget} onClose={() => setFormTarget(null)} onSave={applyForm} />
      )}

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