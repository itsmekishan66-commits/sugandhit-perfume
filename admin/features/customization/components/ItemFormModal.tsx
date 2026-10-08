import { useState } from 'react';
import Modal from '@/components/feedback/Modal';
import FormErrors from '@/components/feedback/FormErrors';
import ImagePreview from '@/components/data-display/ImagePreview';
import RequiredMark from '@/components/ui/RequiredMark';
import { toast } from 'react-toastify';
import { num } from '@/utils';
import { useFormErrors } from '@/hooks/useFormErrors';
import { apiUploadBottleImage, DEFAULT_NOTE_COLOR } from '@/features/customization/customization.service';
import type { BottleTypeOption, ItemFormTarget, ItemTarget, Note, PaletteBase, SizeOption } from '../customization.types';

/** Which editor to render — the form only reads the fields its kind uses. */
type FormKind = 'note' | 'bases' | 'sizes' | 'bottleTypes';

/** Short noun per editor, used in the Add title/button ("+ Add Base" and friends). */
const NOUN: Record<FormKind, string> = { note: 'Note', bases: 'Base', sizes: 'Size', bottleTypes: 'Bottle Type' };

/** Temporary client-side id for a row being added; the server assigns the real one on save. */
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Editable values are kept as strings so inputs behave (empty price, partial
 * numbers); they are parsed back to numbers on save.
 */
interface EditForm {
  name: string;
  icon: string;
  color: string;
  price: string;
  description: string;
  code: string;
  extraPrice: string;
  label: string;
  ml: string;
  desc: string;
  image: string;
}

const EMPTY_FORM: EditForm = {
  name: '',
  icon: '',
  color: DEFAULT_NOTE_COLOR,
  price: '',
  description: '',
  code: '',
  extraPrice: '',
  label: '',
  ml: '',
  desc: '',
  image: '',
};

/** Blank/zero prices show as an empty field (same rule as the list page's editors). */
const priceValue = (value: number): string => (value ? String(value) : '');

/**
 * Positive single-literal checks come first, the multi-literal note variant
 * last — TypeScript drops each single-literal member on the else path but
 * won't progressively narrow the note union, so it has to be the remainder.
 * A null item means Add, so every field falls back to its empty default.
 */
const formFromTarget = (target: ItemFormTarget): EditForm => {
  if (target.section === 'bases') {
    return {
      ...EMPTY_FORM,
      name: target.item?.name ?? '',
      code: target.item?.code ?? '',
      description: target.item?.description ?? '',
      extraPrice: target.item ? priceValue(target.item.extraPrice) : '',
    };
  }
  if (target.section === 'sizes') {
    return {
      ...EMPTY_FORM,
      label: target.item?.label ?? '',
      ml: target.item?.ml ?? '',
      price: target.item ? priceValue(target.item.price) : '',
      desc: target.item?.desc ?? '',
    };
  }
  if (target.section === 'bottleTypes') {
    return {
      ...EMPTY_FORM,
      name: target.item?.name ?? '',
      code: target.item?.code ?? '',
      description: target.item?.description ?? '',
      image: target.item?.image ?? '',
      extraPrice: target.item ? priceValue(target.item.extraPrice) : '',
    };
  }
  return {
    ...EMPTY_FORM,
    name: target.item?.name ?? '',
    // New notes start with the emoji the old inline add form prefilled.
    icon: target.item ? target.item.icon : '🌸',
    color: target.item?.color || DEFAULT_NOTE_COLOR,
    price: priceValue(target.item?.price ?? 0),
    description: target.item?.description ?? '',
  };
};

const fieldCls = 'w-full rounded-xl border border-gold/20 bg-cream/50 px-3 py-2.5 text-sm text-ink outline-none focus:border-gold';
const labelCls = 'mb-1.5 block text-sm text-ink-soft font-medium';
const uploadBtnCls =
  'inline-flex items-center gap-1.5 shrink-0 px-3 py-2.5 text-sm border border-gold/30 rounded-xl bg-sand/60 hover:bg-sand/80 transition-colors cursor-pointer';

interface ItemFormModalProps {
  /** Auth token for the bottle-image upload endpoint. */
  token: string;
  /** Section to open, plus the saved row to edit — or null to add a new one. */
  target: ItemFormTarget;
  onClose: () => void;
  /** Hands the finished row back to the page, which applies it and re-syncs the section. */
  onSave: (updated: ItemTarget) => void;
}

/**
 * Popup form for one customization row — both the pencil (edit) and the
 * "+ Add" buttons open this, so creating and editing share one design and
 * never leave the list (same idea as /list, in modal form).
 */
const ItemFormModal = ({ token, target, onClose, onSave }: ItemFormModalProps) => {
  const [form, setForm] = useState<EditForm>(() => formFromTarget(target));
  /** Snapshot of the loaded values, so "nothing changed" can be detected on save. */
  const [initialForm] = useState<EditForm>(() => formFromTarget(target));
  const [uploading, setUploading] = useState(false);
  /** Image source lock: uploading disables the URL field, a typed URL disables the upload button. */
  const [imgMode, setImgMode] = useState<'upload' | 'url' | null>(null);
  /** Inline "nothing changed" notice above the buttons (the toast fires as well). */
  const [notice, setNotice] = useState<string | null>(null);
  const { errors, validate, clearErrors } = useFormErrors();

  const kind: FormKind =
    target.section === 'topNotes' || target.section === 'heartNotes' || target.section === 'baseNotes'
      ? 'note'
      : target.section === 'bases'
        ? 'bases'
        : target.section === 'sizes'
          ? 'sizes'
          : 'bottleTypes';

  const isNew = target.item === null;

  const update = (patch: Partial<EditForm>) => {
    setForm(prev => ({ ...prev, ...patch }));
    setNotice(null); // drop the stale notice as soon as a field is touched
    clearErrors(); // …and the stale validation reasons
  };

  /** Uploads a picked file and stores the returned URL in the image field. */
  const handleImageUpload = async (file: File | undefined, input: HTMLInputElement) => {
    input.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5 MB or smaller.');
      return;
    }
    setUploading(true);
    try {
      const res = await apiUploadBottleImage(token, file);
      update({ image: res.url });
      setImgMode('upload');
      toast.success('Image uploaded.');
    } catch (error) {
      toast.error((error as Error).message || 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    // Collect every failing reason, so the banner + toast above the buttons
    // explain the whole block instead of only the first problem.
    if (
      !validate([
        kind === 'note' && !form.name.trim() && 'Note name is required.',
        (kind === 'bases' || kind === 'bottleTypes') && !form.name.trim() && 'Name is required.',
        (kind === 'bases' || kind === 'bottleTypes') && !form.code.trim() && 'Code is required.',
        kind === 'sizes' && !form.label.trim() && 'Label is required.',
        kind === 'sizes' && !form.ml.trim() && 'ML value is required.',
        kind === 'bottleTypes' &&
          !!form.image.trim() &&
          !/^https?:\/\//i.test(form.image.trim()) &&
          'Image must be a valid http(s) URL.',
      ])
    ) {
      return;
    }
    if (JSON.stringify(form) === JSON.stringify(initialForm)) {
      setNotice('Nothing changed to save.');
      toast.info('Nothing changed to save.');
      return;
    }

    // Positive single-literal checks first; the multi-literal note variant is
    // the remainder (TS won't narrow it away through an || chain).
    if (target.section === 'bases') {
      const item: PaletteBase = {
        id: target.item?.id ?? genId(),
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description,
        extraPrice: num(form.extraPrice),
      };
      onSave({ section: 'bases', item });
    } else if (target.section === 'sizes') {
      const item: SizeOption = {
        id: target.item?.id ?? genId(),
        label: form.label.trim(),
        ml: form.ml.trim(),
        price: num(form.price),
        desc: form.desc,
      };
      onSave({ section: 'sizes', item });
    } else if (target.section === 'bottleTypes') {
      const item: BottleTypeOption = {
        id: target.item?.id ?? genId(),
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description,
        image: form.image.trim(),
        extraPrice: num(form.extraPrice),
      };
      onSave({ section: 'bottleTypes', item });
    } else {
      const item: Note = {
        id: target.item?.id ?? genId(),
        name: form.name.trim(),
        icon: form.icon.trim(),
        color: form.color.trim() || DEFAULT_NOTE_COLOR,
        price: num(form.price),
        description: form.description,
      };
      onSave({ section: target.section, item });
    }
  };

  const currentTitle = target.section === 'sizes' ? target.item?.label : target.item?.name;

  return (
    <Modal open title={isNew ? `Add ${NOUN[kind]}` : `Edit ${currentTitle || 'item'}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-col gap-4">
        {kind === 'note' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Icon</label>
                <input className={fieldCls} value={form.icon} onChange={(e) => update({ icon: e.target.value })} placeholder="🌸" />
              </div>
              <div>
                <label className={labelCls}>Name<RequiredMark /></label>
                <input className={fieldCls} value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Rose" />
              </div>
              <div>
                <label className={labelCls}>Color (hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-xl border border-gold/20 cursor-pointer"
                    value={form.color || DEFAULT_NOTE_COLOR}
                    onChange={(e) => update({ color: e.target.value })}
                  />
                  <input
                    className={fieldCls}
                    value={form.color}
                    onChange={(e) => update({ color: e.target.value })}
                    placeholder={DEFAULT_NOTE_COLOR}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Price (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  className={fieldCls}
                  value={form.price}
                  onChange={(e) => update({ price: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                rows={3}
                className={fieldCls}
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="What it smells like"
              />
            </div>
          </>
        ) : kind === 'bases' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Name<RequiredMark /></label>
                <input className={fieldCls} value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Eau de Toilette" />
              </div>
              <div>
                <label className={labelCls}>Code<RequiredMark /></label>
                <input className={fieldCls} value={form.code} onChange={(e) => update({ code: e.target.value })} placeholder="EDT" />
              </div>
              <div>
                <label className={labelCls}>Extra Price (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  className={fieldCls}
                  value={form.extraPrice}
                  onChange={(e) => update({ extraPrice: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                rows={3}
                className={fieldCls}
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Light and fresh"
              />
            </div>
          </>
        ) : kind === 'sizes' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Label<RequiredMark /></label>
                <input className={fieldCls} value={form.label} onChange={(e) => update({ label: e.target.value })} placeholder="30 ml" />
              </div>
              <div>
                <label className={labelCls}>ML Value<RequiredMark /></label>
                <input className={fieldCls} value={form.ml} onChange={(e) => update({ ml: e.target.value })} placeholder="30ml" />
              </div>
              <div>
                <label className={labelCls}>Price (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  className={fieldCls}
                  value={form.price}
                  onChange={(e) => update({ price: e.target.value })}
                  placeholder="399"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                rows={3}
                className={fieldCls}
                value={form.desc}
                onChange={(e) => update({ desc: e.target.value })}
                placeholder="Samples & travel"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className={labelCls}>Image — upload or URL</label>
              <div className="flex gap-2 items-stretch">
                <label
                  className={imgMode === 'url' ? `${uploadBtnCls} opacity-40 cursor-not-allowed` : uploadBtnCls}
                  title={imgMode === 'url' ? 'Clear the URL below to enable upload' : 'Upload an image file'}
                >
                  {uploading ? 'Uploading…' : 'Upload image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={imgMode === 'url' || uploading}
                    onChange={(e) => {
                      void handleImageUpload(e.target.files?.[0] ?? undefined, e.currentTarget);
                    }}
                  />
                </label>
                <div className="flex-1 min-w-40 relative">
                  <input
                    className={`${fieldCls} ${imgMode === 'upload' ? 'opacity-50 cursor-not-allowed pr-9' : ''}`}
                    value={form.image}
                    disabled={imgMode === 'upload'}
                    placeholder={imgMode === 'upload' ? 'Uploaded image — click ✕ to use a URL' : 'https://… or upload'}
                    onChange={(e) => {
                      const value = e.target.value;
                      update({ image: value });
                      setImgMode(value.trim() ? 'url' : null);
                    }}
                  />
                  {imgMode === 'upload' && (
                    <button
                      type="button"
                      onClick={() => {
                        update({ image: '' });
                        setImgMode(null);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600 hover:bg-red-50 rounded-md px-1.5 py-0.5 text-sm"
                      title="Clear image and re-enable both options"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              {form.image && (
                <ImagePreview
                  src={form.image}
                  alt={form.name || 'Bottle type'}
                  className="mt-3 w-28 h-28 object-cover rounded-xl border border-gold/20 bg-cream/50"
                  errorClassName="mt-3 w-28 h-28 rounded-xl border border-dashed border-red-300 bg-red-50/60 text-red-500 flex flex-col items-center justify-center gap-1 text-center px-1 text-[10px] leading-tight"
                  errorLabel="Invalid image link"
                />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Name<RequiredMark /></label>
                <input className={fieldCls} value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Classic Clear Glass" />
              </div>
              <div>
                <label className={labelCls}>Code<RequiredMark /></label>
                <input className={fieldCls} value={form.code} onChange={(e) => update({ code: e.target.value })} placeholder="classic" />
              </div>
              <div>
                <label className={labelCls}>Extra Price (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  className={fieldCls}
                  value={form.extraPrice}
                  onChange={(e) => update({ extraPrice: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                rows={3}
                className={fieldCls}
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Timeless clear glass"
              />
            </div>
          </>
        )}

        {notice && (
          <div className="px-4 py-2.5 rounded-xl text-sm font-medium border bg-ink-soft/5 text-ink-soft border-gold/15">
            {notice}
          </div>
        )}

        <FormErrors errors={errors} />

        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gold/25 bg-white/70 px-6 py-3 text-sm font-medium text-ink-soft hover:text-espresso cursor-pointer"
          >
            Cancel
          </button>
          <button type="submit" disabled={uploading} className="btn-primary w-40 py-3 disabled:opacity-50">
            {isNew ? `Add ${NOUN[kind]}` : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ItemFormModal;
