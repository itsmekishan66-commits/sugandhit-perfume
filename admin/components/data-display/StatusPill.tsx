import { toneFor } from '@/utils/labels';
import Pill from './Pill';

const StatusPill = ({
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

export default StatusPill;