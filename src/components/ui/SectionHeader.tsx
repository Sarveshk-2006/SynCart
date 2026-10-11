/**
 * SectionHeader — consistent heading for page sections.
 */
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-3', className)}>
      <div>
        <h2 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
