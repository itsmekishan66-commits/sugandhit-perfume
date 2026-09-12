interface NavbarProps {
  setToken: (token: string) => void;
}

const Navbar = ({ setToken }: NavbarProps) => {
  return (
    <div className='flex items-center py-3 px-[4%] justify-between bg-white border-b border-orange-100/60 sticky top-0 z-30'>
      <div className='flex items-center gap-2'>
        <span className='w-4 h-4 rounded-full bg-gradient-to-br from-[#7c2d12] to-[#C586A5]'></span>
        <h1 className='text-2xl font-bold gradient-text'>Sugandhit</h1>
        <span className='text-xs uppercase tracking-widest text-gray-400 mt-1'>Perfume Admin</span>
      </div>
      <button onClick={() => setToken('')} className='bg-[#7c2d12] text-white px-5 py-2 sm:px-7 rounded-full text-sm font-medium hover:bg-[#5b1f0d] transition-colors'>Logout</button>
    </div>
  )
}

export default Navbar