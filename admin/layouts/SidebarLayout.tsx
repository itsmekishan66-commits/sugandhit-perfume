import type { ReactNode } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

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
        <div className='w-[70%] mx-auto my-8 text-gray-600 text-base'>
          {children}
        </div>
      </div>
    </>
  )
}

export default SidebarLayout