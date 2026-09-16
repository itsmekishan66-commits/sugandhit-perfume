import type { ReactNode } from 'react'

const BlankLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-cream text-ink">{children}</div>
)

export default BlankLayout