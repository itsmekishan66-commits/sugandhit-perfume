import Reveal from '@/components/ui/Reveal'

const OurPolicy = () => {
  const policies = [
    { icon: '🌿', title: 'Small-Batch Craft', desc: 'Every bottle is hand-blended in limited batches so your perfume is always fresh and artisanal.' },
    { icon: '🚚', title: 'On-Time Delivery', desc: 'We blend on order and ship swiftly, so your signature scent arrives exactly when you need it.' },
    { icon: '🎁', title: 'Luxury Gifting', desc: 'Presented in curated packaging worth unwrapping — perfect for the ones you love.' },
    { icon: '🤝', title: '24/7 Concierge', desc: 'Our fragrance concierge guides you through notes and bases, day or night.' },
  ];

  return (
    <section className="my-24 py-14 rounded-[2rem] bg-gradient-to-br from-white via-sand/40 to-blush/60 border border-gold/15">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-6 md:px-12">
        {policies.map((p, i) => (
          <Reveal key={p.title} delay={i * 100} className="text-center px-4">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white shadow-lg shadow-espresso/10 flex items-center justify-center text-3xl border border-gold/20">
              {p.icon}
            </div>
            <p className="font-display text-xl font-semibold">{p.title}</p>
            <p className="text-sm text-ink-soft mt-2 leading-relaxed">{p.desc}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default OurPolicy;