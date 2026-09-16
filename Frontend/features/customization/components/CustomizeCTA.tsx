import { Link } from 'react-router-dom'
import Reveal from '@/components/ui/Reveal'
import { useApp } from '@/context/AppContext'

const CustomizeCTA = () => {
  const { palette } = useApp();
  const topNotes = (palette.top || []).slice(0, 4);

  return (
    <section className="my-24 relative overflow-hidden rounded-4xl bg-deep text-cream">
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 30%, #c9a227 2px, transparent 2.5px)', backgroundSize: '44px 44px' }} />
      <div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-gold/15 blur-3xl" />

      <div className="relative grid md:grid-cols-2 gap-10 items-center px-8 md:px-16 py-16">
        <Reveal direction="left">
          <p className="text-gold tracking-luxe uppercase text-xs mb-4">The Signature Studio</p>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.1]">
            Design a scent that
            <br />
            <span className="italic gold-text">has never existed before.</span>
          </h2>
          <p className="mt-6 text-cream/70 leading-relaxed max-w-md">
            Layer otto from 3 pyramids — pick your top, heart and base notes,
            choose a base (oil, EDP, EDC, spray or attar), pick a bottle size
            and we hand-blend it fresh for you.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {topNotes.map((n) => (
              <span key={n.id} className="px-3 py-1.5 rounded-full border border-gold/40 text-xs tracking-wide text-gold-soft">{n.name}</span>
            ))}
            <span className="px-3 py-1.5 rounded-full border border-cream/20 text-xs tracking-wide text-cream/50">+46 more</span>
          </div>
          <Link to="/customize" className="btn-gold mt-9">
            Start Designing — Rs. 399
          </Link>
        </Reveal>

        <Reveal direction="right" className="hidden md:flex items-center justify-center">
          <div className="relative">
            <div className="w-64 h-64 rounded-full bg-linear-to-br from-espresso/60 to-gold/40 flex items-center justify-center float-anim">
              <div className="text-center">
                <p className="font-display text-lg italic text-cream/80">hand-blended</p>
                <p className="font-display text-6xl font-medium gold-text">III</p>
                <p className="text-[10px] tracking-luxe uppercase text-cream/60 mt-1">· top · heart · base ·</p>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-32 h-32 rounded-2xl bg-white/5 border border-gold/30 backdrop-blur px-4 py-5 float-anim-late">
              <p className="text-[10px] tracking-luxe uppercase text-gold">Base</p>
              <p className="font-display text-xl mt-1">Oil</p>
              <p className="font-display text-xl">Spray</p>
              <p className="font-display text-xl">Attar</p>
              <p className="font-display text-xl">EDP</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CustomizeCTA