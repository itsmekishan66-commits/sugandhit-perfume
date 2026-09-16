import type { ReactNode } from 'react';
import { toneFor } from '../../utils';

const TONES: Record<string, string> = {
  gold: 'bg-gold/10 text-espresso',
  green: 'bg-blush text-espresso',
  red: 'bg-espresso/10 text-espresso',
  amber: 'bg-gold/15 text-ink',
  blue: 'bg-gold/10 text-espresso',
  gray: 'bg-cream text-ink-soft',
};

export const Pill = ({ tone, children }: { tone: string; children: ReactNode }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-gold/20 px-3 py-1 text-xs font-semibold ${TONES[tone] ?? TONES.gold}`}>
      {children}
    </span>
  );
};

export const StatusPill = ({
  value,
  label: customLabel,
  tone,
}: {
  value: string | null | undefined;
  label?: string;
  tone?: string;
}) => {
  const t = tone ?? toneFor(value);
  const l = customLabel ?? value ?? '—';
  return (
    <Pill tone={t}>
      <span className={`w-1.5 h-1.5 rounded-full ${t === 'gold' || t === 'amber' ? 'bg-gold' : t === 'green' ? 'bg-espresso/70' : t === 'red' ? 'bg-espresso' : 'bg-ink-soft/40'}`} />
      <span className="capitalize">{l.replace(/_/g, ' ')}</span>
    </Pill>
  );
};