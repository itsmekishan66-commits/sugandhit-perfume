import type { ChangeEvent } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /** Label of the "no filter" option, shown above the real options. Defaults to "All". */
  allLabel?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Dropdown that filters a list. An empty `value` means "everything" and is
 * rendered as the `allLabel` option; callers pass `''` for the reset default.
 */
const FilterSelect = ({ value, onChange, options, allLabel = 'All', ariaLabel, className = '' }: FilterSelectProps) => {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className={`select-soft border border-gold/25 bg-white/70 text-espresso rounded-xl p-2 pr-8 focus:border-gold cursor-pointer text-sm ${className}`}
    >
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default FilterSelect;