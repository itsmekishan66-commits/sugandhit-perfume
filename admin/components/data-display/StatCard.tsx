import type { ReactNode } from 'react';

const StatCard = ({
  label,
  value,
  sub,
  icon,
  tint = 'from-gold-soft to-gold',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tint?: string;
}) => {
  return (
    <div className={`flex flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br ${tint} p-5 text-[#2b1d16] shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-medium opacity-80">{label}</p>
        {icon && <span className="opacity-70 shrink-0">{icon}</span>}
      </div>
      <div>
        <p className="font-display text-3xl font-bold leading-tight tabular-nums truncate">{value}</p>
        {sub && <p className="mt-1 text-xs font-medium opacity-70">{sub}</p>}
      </div>
    </div>
  );
};

export default StatCard;