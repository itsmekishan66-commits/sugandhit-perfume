const items = [
  'Handcrafted in Small Batches',
  'Custom Perfume Studio',
  'Cruelty-Free & IFRA Compliant',
  'Shipping Across the Globe',
];

const Marquee = () => {
  const row = [...items, ...items];
  return (
    <div className="bg-ink text-cream py-2.5 overflow-hidden select-none">
      <div className="marquee-track text-xs tracking-luxe uppercase">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-6 px-6 whitespace-nowrap">
            <span>{t}</span>
            <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;