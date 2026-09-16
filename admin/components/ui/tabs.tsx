export const Tabs = ({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1 p-4 border-b border-gold/15">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
            active === t.key ? 'bg-sand text-espresso border border-gold/30' : 'text-ink-soft hover:bg-cream border border-transparent'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};