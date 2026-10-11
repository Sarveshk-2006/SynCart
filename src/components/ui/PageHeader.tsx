/**
 * PageHeader — standard page-level heading with subtitle and optional actions.
 * Used at the top of every Phase 1 module page.
 */
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode // right-side actions
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <span
            className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md uppercase tracking-wider select-none"
            aria-label="Demo environment indicator"
          >
            Demo
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 max-w-2xl mt-1 leading-normal">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">{children}</div>
      )}
    </div>
  )
}
