import type { ReactNode } from 'react';
import Modal from '@/components/feedback/Modal';
import ImagePreview from '@/components/data-display/ImagePreview';
import type { ItemTarget, NoteSection } from '../customization.types';

const isNoteTarget = (t: ItemTarget): t is Extract<ItemTarget, { section: NoteSection }> =>
  t.section === 'topNotes' || t.section === 'heartNotes' || t.section === 'baseNotes';

const LAYER_LABEL: Record<NoteSection, string> = {
  topNotes: 'Top Note',
  heartNotes: 'Heart Note',
  baseNotes: 'Base Note',
};

/** Detail card — same shape as the cards in the /list view modal. */
const Field = ({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-gold/15 bg-cream/60 p-3 ${className}`}>
    <p className="text-xs text-ink-soft">{label}</p>
    <p className="font-medium text-ink">{children}</p>
  </div>
);

const Description = ({ text }: { text?: string }) =>
  text ? (
    <div>
      <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">Description</p>
      <p className="text-sm text-ink whitespace-pre-wrap">{text}</p>
    </div>
  ) : null;

const priceText = (extraPrice: number) => (Number(extraPrice) > 0 ? `Rs. ${extraPrice}` : 'Included');

const ViewItemModal = ({ target, onClose }: { target: ItemTarget | null; onClose: () => void }) => (
  <Modal open={!!target} title={target ? (target.section === 'sizes' ? target.item.label : target.item.name) : 'Details'} onClose={onClose}>
    {target && (
      <div className="flex flex-col gap-5">
        {isNoteTarget(target) && (
          <>
            <div className="flex items-center gap-4">
              <span className="text-4xl">{target.item.icon}</span>
              <div className="min-w-0">
                <p className="font-display text-2xl font-semibold text-ink">{target.item.name}</p>
                <p className="text-sm text-ink-soft">{LAYER_LABEL[target.section]}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Field label="Color (hex)">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 rounded-full shrink-0 border border-gold/30" style={{ background: target.item.color }} />
                  {target.item.color}
                </span>
              </Field>
              <Field label="Price">Rs. {target.item.price}</Field>
            </div>
            <Description text={target.item.description} />
          </>
        )}

        {target.section === 'bases' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Field label="Code">{target.item.code}</Field>
              <Field label="Extra price">{priceText(target.item.extraPrice)}</Field>
            </div>
            <Description text={target.item.description} />
          </>
        )}

        {target.section === 'sizes' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Field label="ML value">{target.item.ml}</Field>
              <Field label="Price">Rs. {target.item.price}</Field>
            </div>
            <Description text={target.item.desc} />
          </>
        )}

        {target.section === 'bottleTypes' && (
          <>
            {target.item.image && (
              <ImagePreview
                src={target.item.image}
                alt={target.item.name}
                className="w-40 h-40 rounded-2xl border border-gold/15 object-cover bg-cream"
                errorClassName="w-40 h-40 rounded-2xl border border-dashed border-red-300 bg-red-50/60 text-red-500 flex flex-col items-center justify-center gap-1 text-center px-2 text-xs"
                errorLabel="Invalid image link"
              />
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Field label="Code">{target.item.code}</Field>
              <Field label="Extra price">{priceText(target.item.extraPrice)}</Field>
            </div>
            <Description text={target.item.description} />
          </>
        )}
      </div>
    )}
  </Modal>
);

export default ViewItemModal;
