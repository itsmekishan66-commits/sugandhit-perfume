import { NavLink } from 'react-router-dom'
import { navGroups } from '../../app/nav'

const Sidebar = () => {
  return (
    <div className='hidden lg:block w-[18%] bg-white/70 border-r border-gold/15 backdrop-blur-sm sticky top-14 self-start h-[calc(100vh-57px)] overflow-y-auto overscroll-contain'>
      <div className='pt-6 flex flex-col gap-4 pl-[12%] pr-4 text-[15px]'>
        {navGroups.map((group) => (
          <div key={group.section ?? 'main'} className='flex flex-col gap-3'>
            {group.section && (
              <p className='pl-4 text-[11px] uppercase tracking-luxe text-ink-soft/60'>{group.section}</p>
            )}
            {group.links.map((link) => (
              <NavLink
                key={link.to}
                end={link.end}
                className='flex items-center gap-3 border border-gold/15 px-4 py-3 rounded-xl text-ink-soft hover:bg-sand hover:text-espresso hover:border-gold/40 transition-colors side-link'
                to={link.to}
              >
                <p className='text-xl'>{link.icon}</p>
                <p className='hidden md:block'>{link.label}</p>
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sidebar