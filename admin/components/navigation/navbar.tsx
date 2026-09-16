interface NavbarProps {
  onLogout: () => void;
}

const Navbar = ({ onLogout }: NavbarProps) => {
  return (
    <div className='flex items-center py-3 px-[4%] justify-between bg-white/75 border-b border-gold/15 backdrop-blur-md sticky top-0 z-30'>
      <div className='flex items-center gap-2'>
        <span className='flex items-center justify-center h-8 w-8 rounded-full bg-linear-to-br from-gold-soft to-gold font-display text-lg italic text-ink/70 shadow-gold/30 shadow-md'>S</span>
        <h1 className='font-display text-2xl font-semibold'>Sugandhit<span className='gold-text'>.</span></h1>
        <span className='hidden lg:block mt-1 text-[10px] uppercase tracking-luxe text-ink-soft'>Perfume Admin</span>
      </div>
      <button onClick={onLogout} className='bg-ink text-cream px-5 py-2 sm:px-7 rounded-full text-sm font-medium hover:bg-espresso transition-colors'>Logout</button>
    </div>
  )
}

export default Navbar