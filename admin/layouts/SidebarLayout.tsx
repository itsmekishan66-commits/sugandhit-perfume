import type { ReactNode } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import BottomNav from '../components/BottomNav'

interface SidebarLayoutProps {
  setToken: (token: string) => void;
  children: ReactNode;
}

const SidebarLayout = ({ setToken, children }: SidebarLayoutProps) => {
  return (
    <>
      <Navbar setToken={setToken} />
      <div className='flex w-full'>
        <Sidebar />
        <div className='w-full lg:w-[70%] mx-4 lg:mx-10 my-8 pb-28 lg:pb-8 text-ink-soft text-base'>
          {children}
        </div>
      </div>
      <BottomNav />
    </>
  )
}

export default SidebarLayout