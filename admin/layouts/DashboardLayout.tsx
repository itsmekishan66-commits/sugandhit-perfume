import type { ReactNode } from 'react'
import Navbar from '../components/navigation/navbar'
import Sidebar from '../components/navigation/sidebar'
import BottomNav from '../components/navigation/bottom-nav'
import { useAuth } from '../context/useAuth'

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { logout } = useAuth()
  return (
    <>
      <Navbar onLogout={logout} />
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

export default DashboardLayout