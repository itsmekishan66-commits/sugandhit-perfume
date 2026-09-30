import type { ReactNode } from 'react';

const SectionCard = ({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={`bg-white/70 rounded-2xl border border-gold/15 shadow-sm backdrop-blur ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gold/15">
          <div>
            {title && <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="text-sm text-ink-soft mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
};

export default SectionCard;