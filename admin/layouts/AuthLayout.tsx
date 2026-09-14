import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className='min-h-screen flex items-center justify-center w-full bg-gradient-to-br from-cream via-sand/40 to-blush/60 p-4'>
      {children}
    </div>
  )
}

export default AuthLayout