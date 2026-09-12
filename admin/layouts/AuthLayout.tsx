import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className='min-h-screen flex items-center justify-center w-full bg-gradient-to-br from-[#fdf6ef] via-[#f7e8ef] to-[#f3dfd8] p-4'>
      {children}
    </div>
  )
}

export default AuthLayout