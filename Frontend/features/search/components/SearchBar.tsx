import { Search, X } from 'lucide-react'
import { useApp } from '@/context/AppContext'

const SearchBar = () => {
  const { search, setSearch, showSearch, setShowSearch } = useApp();
  return showSearch ? (
    <div className="flex items-center justify-center gap-3 py-2">
      <div className="inline-flex items-center justify-center border border-gold/30 bg-white/70 px-5 py-3 rounded-full w-3/4 sm:w-1/2 shadow-sm focus-within:border-gold transition-colors">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 outline-none bg-transparent text-sm text-ink" type="text" placeholder="Search our collection…" />
        <Search className="w-4 opacity-60" />
      </div>
      <X onClick={() => setShowSearch(false)} className="w-4 cursor-pointer opacity-60 hover:opacity-100 transition-opacity" />
    </div>
  ) : null
}

export default SearchBar