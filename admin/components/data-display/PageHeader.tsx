import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

const PageHeader = ({ title, subtitle, trailing }: PageHeaderProps) => {
  return (
    <div className="mb-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 -mt-5">
      <div>
        <h1 className="font-display text-4xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-ink-soft mt-1">{subtitle}</p>}
      </div>
      {trailing}
    </div>
  )
}

export default PageHeader