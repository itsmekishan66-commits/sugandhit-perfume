import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '@/components/ui/Reveal'
import Loading from '@/components/ui/Loading'
// import { useApp } from '@/context/AppContext'

interface Note {
  id: string
  name: string
  emoji: string
}

interface Selections {
  top: Note | null
  heart: Note | null
  base: Note | null
}

interface MousePosition {
  x: number
  y: number
}

const pyramids: Record<string, Note[]> = {
  top: [
    { id: 'bergamot', name: 'Bergamot', emoji: '🍊' },
    { id: 'lemon', name: 'Lemon Zest', emoji: '🍋' },
    { id: 'lavender', name: 'Lavender', emoji: '💜' },
    { id: 'mint', name: 'Fresh Mint', emoji: '🌿' },
    { id: 'pink-pepper', name: 'Pink Pepper', emoji: '🌶️' },
    { id: 'grapefruit', name: 'Grapefruit', emoji: '🍊' },
  ],
  heart: [
    { id: 'rose', name: 'Damask Rose', emoji: '🌹' },
    { id: 'jasmine', name: 'Jasmine', emoji: '🤍' },
    { id: 'iris', name: 'Iris', emoji: '💐' },
    { id: 'ylang', name: 'Ylang Ylang', emoji: '🌼' },
    { id: 'geranium', name: 'Geranium', emoji: '🌺' },
    { id: 'neroli', name: 'Neroli', emoji: '🧡' },
  ],
  base: [
    { id: 'oud', name: 'Royal Oud', emoji: '🪵' },
    { id: 'musk', name: 'White Musk', emoji: '🤍' },
    { id: 'sandalwood', name: 'Sandalwood', emoji: '🪵' },
    { id: 'amber', name: 'Amber', emoji: '🟠' },
    { id: 'vetiver', name: 'Vetiver', emoji: '🌾' },
    { id: 'vanilla', name: 'Vanilla', emoji: '🍦' },
  ],
}

const tierLabels: Record<string, { label: string; sub: string; color: string }> = {
  top: { label: 'Top Notes', sub: 'First Impression', color: 'from-amber-400 to-yellow-300' },
  heart: { label: 'Heart Notes', sub: 'The Soul', color: 'from-rose-400 to-pink-300' },
  base: { label: 'Base Notes', sub: 'The Foundation', color: 'from-amber-700 to-orange-500' },
}

const CustomizeCTA = () => {
  // const { palette } = useApp()
  const sectionRef = useRef<HTMLElement>(null)
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 })
  const [activeTier, setActiveTier] = useState<string>('top')
  const [selections, setSelections] = useState<Selections>({ top: null, heart: null, base: null })
  const [baseType, setBaseType] = useState<string>('Oil')
  const [isHovered, setIsHovered] = useState<boolean>(false)

  const allSelected = selections.top !== null && selections.heart !== null && selections.base !== null

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const selectNote = (tier: string, note: Note) => {
    setSelections((prev) => ({
      ...prev,
      [tier]: prev[tier as keyof Selections]?.id === note.id ? null : note,
    }))
  }

  const selectedCount = Object.values(selections).filter((s) => s !== null).length

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="my-24 relative overflow-hidden rounded-4xl bg-deep text-cream mx-4 md:mx-8"
    >
      {/* Animated mesh linear background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-130 h-130 rounded-full bg-gold/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-100 h-100 rounded-full bg-amber-700/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 h-75 rounded-full bg-rose-500/10 blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Mouse-follow glow */}
      <div
        className="absolute w-100 h-100 rounded-full pointer-events-none transition-opacity duration-500"
        style={{
          left: mousePos.x - 200,
          top: mousePos.y - 200,
          background: 'radial-linear(circle, rgba(201,162,39,0.12) 0%, transparent 70%)',
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'radial-linear(circle, #c9a227 1px, transparent 1.5px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold/40"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float-particle ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>

      <div className="relative grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-center px-6 md:px-12 lg:px-16 py-12 md:py-20">
        {/* Left: Interactive Note Selector */}
        <Reveal direction="left">
          <div className="space-y-6">
            <div>
              <p className="text-gold tracking-luxe uppercase text-[11px] mb-3 flex items-center gap-2">
                <span className="w-6 h-px bg-gold/50" />
                The Signature Studio
              </p>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.1]">
                Design a scent that
                <br />
                <span className="italic gold-text">has never existed.</span>
              </h2>
            </div>

            {/* Tier Tabs */}
            <div className="flex gap-1 p-1 rounded-2xl bg-white/4 border border-white/6 backdrop-blur-sm">
              {(['top', 'heart', 'base'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={`flex-1 py-2.5 px-1.5 sm:px-3 rounded-xl text-[9px] sm:text-xs whitespace-nowrap tracking-wide uppercase transition-all duration-300 ${
                    activeTier === tier
                      ? 'bg-gold/15 text-gold border border-gold/30 shadow-lg shadow-gold/5'
                      : 'text-cream/40 hover:text-cream/70 border border-transparent'
                  }`}
                >
                  {tierLabels[tier].label}
                </button>
              ))}
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-3 gap-2">
              {pyramids[activeTier].map((note) => {
                const isSelected = selections[activeTier as keyof Selections]?.id === note.id
                return (
                  <button
                    key={note.id}
                    onClick={() => selectNote(activeTier, note)}
                    className={`group relative p-3 rounded-xl border text-left transition-all duration-300 ${
                      isSelected
                        ? 'bg-gold/10 border-gold/50 shadow-lg shadow-gold/10 scale-[1.02]'
                        : 'bg-white/2 border-white/6 hover:bg-white/5 hover:border-white/12'
                    }`}
                  >
                    <span className="text-lg mb-1 block">{note.emoji}</span>
                    <p className={`text-[11px] leading-tight font-medium transition-colors ${
                      isSelected ? 'text-gold' : 'text-cream/70 group-hover:text-cream/90'
                    }`}>
                      {note.name}
                    </p>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selection Summary */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-1">
                {(['top', 'heart', 'base'] as const).map((tier) => (
                  <div
                    key={tier}
                    className={`w-8 h-8 rounded-full border-2 border-deep flex items-center justify-center text-[10px] font-medium transition-all duration-300 ${
                      selections[tier]
                        ? 'bg-gold/20 text-gold border-gold/40'
                        : 'bg-white/3 text-cream/30 border-white/8'
                    }`}
                  >
                    {selections[tier] ? selections[tier].emoji : tier[0].toUpperCase()}
                  </div>
                ))}
              </div>
              <p className="text-xs text-cream/40">
                <span className="text-gold font-medium">{selectedCount}/3</span> notes selected
              </p>
            </div>
          </div>
        </Reveal>

        {/* Right: Visual Blend Preview */}
        <Reveal direction="right" className="hidden lg:flex items-center justify-center">
          <div className="relative w-full max-w-sm">
            {/* Central Bottle Visualization */}
            <div className="relative flex items-center justify-center py-8">
              {/* Outer ring */}
              <div
                className="absolute w-72 h-72 rounded-full border border-gold/10 transition-all duration-700"
                style={{
                  transform: `rotate(${selectedCount * 30}deg) scale(${1 + selectedCount * 0.03})`,
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gold/40" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gold/40" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold/40" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold/40" />
              </div>

              {/* Middle ring */}
              <div
                className="absolute w-56 h-56 rounded-full border border-gold/15 transition-all duration-500"
                style={{
                  transform: `rotate(-${selectedCount * 20}deg)`,
                }}
              />

              {/* Main circle */}
              <div
                className="relative w-44 h-44 rounded-full flex items-center justify-center transition-all duration-500"
                style={{
                  background: allSelected
                    ? 'linear-linear(135deg, rgba(201,162,39,0.25) 0%, rgba(180,130,50,0.15) 50%, rgba(201,162,39,0.2) 100%)'
                    : 'linear-linear(135deg, rgba(255,255,255,0.04) 0%, rgba(201,162,39,0.08) 100%)',
                  boxShadow: allSelected
                    ? '0 0 60px rgba(201,162,39,0.15), inset 0 0 30px rgba(201,162,39,0.05)'
                    : '0 0 40px rgba(201,162,39,0.05)',
                }}
              >
                <div className="text-center">
                  {allSelected ? (
                    <>
                      <p className="text-[9px] tracking-luxe uppercase text-gold/60 mb-1">Your Blend</p>
                      <p className="font-display text-3xl gold-text italic">III</p>
                      <p className="text-[9px] tracking-luxe uppercase text-cream/40 mt-1">
                        {selections.top?.name} · {selections.heart?.name} · {selections.base?.name}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[9px] tracking-luxe uppercase text-cream/40 mb-1">Select</p>
                      <p className="font-display text-4xl text-cream/20">{3 - selectedCount}</p>
                      <p className="text-[9px] tracking-luxe uppercase text-cream/30 mt-1">more notes</p>
                    </>
                  )}
                </div>
              </div>

              {/* Floating note badges */}
              {(['top', 'heart', 'base'] as const).map((tier, i) => {
                const angle = -90 + i * 120
                const radius = 140
                const x = Math.cos((angle * Math.PI) / 180) * radius
                const y = Math.sin((angle * Math.PI) / 180) * radius
                return (
                  <div
                    key={tier}
                    className={`absolute w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 ${
                      selections[tier]
                        ? 'bg-gold/15 border border-gold/40 shadow-lg shadow-gold/10 scale-100'
                        : 'bg-white/3 border border-white/8 scale-90 opacity-50'
                    }`}
                    style={{
                      left: `calc(50% + ${x}px - 28px)`,
                      top: `calc(50% + ${y}px - 28px)`,
                      animation: selections[tier] ? `float-gentle 3s ease-in-out infinite` : 'none',
                      animationDelay: `${i * 0.5}s`,
                    }}
                  >
                    <span className="text-sm">
                    {selections[tier]?.emoji || (
                      <Loading variant="inline" className="w-6" label={`Select a ${tier} note`} />
                    )}
                  </span>
                    <span className="text-[8px] tracking-wider uppercase text-cream/40 mt-0.5">
                      {tier}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Base Type Selector */}
            <div className="mt-4 p-4 rounded-2xl bg-white/3 border border-white/6 backdrop-blur-sm">
              <p className="text-[10px] tracking-luxe uppercase text-gold/60 mb-3">Choose Your Base</p>
              <div className="grid grid-cols-4 gap-1.5">
                {['Oil', 'EDP', 'Parfume', 'EDT'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setBaseType(type)}
                    className={`py-2 rounded-lg text-[11px] font-medium tracking-wide transition-all duration-300 ${
                      baseType === type
                        ? 'bg-gold/15 text-gold border border-gold/30'
                        : 'text-cream/40 hover:text-cream/70 border border-transparent hover:bg-white/4'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Link
              to="/customize"
              state={{ selections, baseType }}
              className={`mt-5 w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-medium tracking-wide transition-all duration-500 group ${
                allSelected
                  ? 'bg-linear-to-r from-gold to-amber-500 text-deep shadow-xl shadow-gold/20 hover:shadow-gold/30 hover:scale-[1.02]'
                  : 'bg-white/6 text-cream/50 border border-white/8 hover:bg-white/8 hover:text-cream/70'
              }`}
            >
              <span>{allSelected ? 'Complete Your Blend' : 'Start Designing'}</span>
              <span className="text-xs opacity-60">— Rs. 399</span>
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </section>
  )
}

export default CustomizeCTA
