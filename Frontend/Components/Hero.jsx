import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import PerfumeBottle from "./PerfumeBottle";

const Hero = () => {
  return (
    <section className="relative pt-10 md:pt-16 pb-10 overflow-hidden">
      {/* background orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gold/15 blur-3xl breathe" />
      <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-espresso/10 blur-3xl float-anim" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-blush/60 blur-3xl" />

      <div className="relative grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-white/50 text-xs tracking-luxe uppercase text-espresso">
              <span className="w-2 h-2 rounded-full bg-gold" />
              New · The 2026 Collection
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05]">
              Fragrance that is
              <br />
              <span className="italic gold-text">uniquely yours.</span>
            </h1>
          </Reveal>

          <Reveal delay={220}>
            <p className="mt-6 text-ink-soft text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
              At Sugandhit we hand-blend perfumes in small batches and let you compose your own
              signature scent — choose your notes, your base, your story.
            </p>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-8 flex flex-wrap items-center gap-4 justify-center lg:justify-start">
              <Link to="/customize" className="btn-gold">Create My Perfume</Link>
              <Link to="/collection" className="underline-script font-display text-xl text-ink hover:text-espresso transition-colors">
                Explore Collection →
              </Link>
            </div>
          </Reveal>

          <Reveal delay={420}>
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-8">
              {[
                ['50+', 'Signature Notes'],
                ['100%', 'Hand-Blended'],
                ['0%', 'Compromise'],
              ].map(([num, label]) => (
                <div key={label} className="text-center lg:text-left">
                  <p className="font-display text-3xl font-semibold gold-text">{num}</p>
                  <p className="text-xs tracking-luxe uppercase text-ink-soft mt-1">{label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Visual */}
        <Reveal direction="zoom" delay={200} className="relative flex items-center justify-center">
          <div className="relative w-full max-w-md aspect-square">
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blush via-sand to-gold/30 shadow-2xl shadow-gold/20 breathe" />
            <div className="absolute -inset-3 rounded-full border border-gold/20 spin-slow" style={{ background: 'conic-gradient(from 0deg, transparent 0 340deg, rgba(201,162,39,0.35) 360deg)' }} />
            <div className="absolute inset-0 flex items-center justify-center float-anim">
              <PerfumeBottle className="w-56 h-72 drop-shadow-2xl" />
            </div>
            <div className="absolute bottom-4 left-2 card-lux rounded-2xl px-4 py-2.5 text-sm float-anim-late">
              <p className="text-xs tracking-luxe uppercase text-gold">Top</p>
              <p className="font-display text-lg">Bergamot · Neroli</p>
            </div>
            <div className="absolute top-8 right-0 card-lux rounded-2xl px-4 py-2.5 text-sm float-anim-late">
              <p className="text-xs tracking-luxe uppercase text-gold">Soul</p>
              <p className="font-display text-lg">Jasmine · Oud</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Hero;