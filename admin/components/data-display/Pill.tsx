import type { ReactNode } from 'react';

const TONES: Record<string, string> = {
  gold: 'bg-gold/10 text-espresso',
  green: 'bg-blush text-espresso',
  red: 'bg-espresso/10 text-espresso',
  amber: 'bg-gold/15 text-ink',
  blue: 'bg-gold/10 text-espresso',
  gray: 'bg-cream text-ink-soft',
};

const Pill = ({ tone, children }: { tone: string; children: ReactNode }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-gold/20 px-3 py-1 text-xs font-semibold ${TONES[tone] ?? TONES.gold}`}>
      {children}
    </span>
  );
};

export default Pill;