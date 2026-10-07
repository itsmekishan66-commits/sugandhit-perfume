import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Text input with a search icon and a clear button, styled for the boutique
 * admin cards. Fully controlled — the parent owns `value`/`onChange`.
 */
const SearchInput = ({ value, onChange, placeholder = 'Search…', className = '' }: SearchInputProps) => {
  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50 pointer-events-none" />
      <input
        className="w-full py-2 pl-9 pr-8 rounded-xl border border-gold/20 bg-white/70 text-sm outline-none placeholder:text-ink-soft/60 focus:border-gold/50 cursor-text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-espresso cursor-pointer"
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;