import Title from '../Components/Title'
import Reveal from '../Components/Reveal'
// import PerfumeBottle from '../Components/PerfumeBottle'

const About = () => {
  return (
    <div>
      <div className="text-2xl text-left lg:text-3xl pt-2">
        <Title text1={'Crafted'} text2={'with patience'} />
      </div>

      <div className="grid md:grid-cols-2 gap-10 items-center mt-6">
        <Reveal direction="left">
          <div className="relative rounded-4xl bg-linear-to-br from-blush via-sand to-gold/25 flex items-center justify-center py-0 overflow-hidden">
            <div className="absolute -top-16 -left-16 w-84 h-84 rounded-full bg-gold/15 blur-3xl floating" />
            <img
              src="/sugandhit-prototype4.jpeg"
              alt="Sugandhit perfume prototype"
              className="relative w-138 h-110 object-cover rounded-3xl drop-shadow-2xl"
              // className="relative w-52 h-64 object-cover rounded-3xl drop-shadow-2xl float-anim"
            />
          </div>
        </Reveal>

        <Reveal direction="right">
          <p className="font-display text-lg italic text-espresso mb-4">“Perfume is the most intense form of memory.”</p>
          <p className="text-ink-soft leading-relaxed">
            Sugandhit began with one belief — that a fragrance should be as personal as a thumbprint.
            We are a boutique perfume studio that hand-blends every bottle in small batches,
            macerating each blend until it reaches its perfect balance.
          </p>
          <p className="text-ink-soft leading-relaxed mt-4">
            From rare ouds and attars to freshly composed EDPs, we work with honest ingredients
            and an obsessive eye for detail. And with our Signature Studio, you get to compose
            your own scent — note by note, layer by layer.
          </p>
        </Reveal>
      </div>

      <Reveal className="my-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ['01', 'Curate', 'Notes from three pyramids, chosen by you.'],
            ['02', 'Blend', 'Our perfumer weighs and marries every note.'],
            ['03', 'Macerate', 'Rest time lets the blend bloom.'],
            ['04', 'Deliver', 'Sealed and shipped in signature packaging.'],
          ].map(([n, t, d]) => (
            <div key={n} className="card-lux rounded-2xl p-6">
              <p className="font-display text-4xl gold-text font-semibold">{n}</p>
              <p className="font-display text-xl mt-2">{t}</p>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
};

export default About