/**
 * Badge — compact status/label chip.
 * Variants: default, success, warning, danger, info, muted
 */
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'brand'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100/80 text-slate-700 border-slate-200/80',
  success: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/90',
  warning: 'bg-amber-50/90 text-amber-800 border-amber-200/90',
  danger:  'bg-rose-50/90 text-rose-700 border-rose-200/90',
  info:    'bg-sky-50/90 text-sky-800 border-sky-200/90',
  muted:   'bg-slate-50 text-slate-500 border-slate-200/60',
  brand:   'bg-emerald-600 text-white border-emerald-700 shadow-2xs',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-rose-500',
  info:    'bg-sky-500',
  muted:   'bg-slate-400',
  brand:   'bg-white',
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border select-none',
        variantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
