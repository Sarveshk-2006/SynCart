/**
 * EmptyState — shown when a list or section has no data.
 */
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 py-10 text-center',
        className,
      )}
      role="status"
      aria-label={title}
    >
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-1">
        <Icon className="w-5 h-5 text-slate-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && <p className="text-xs text-slate-400 max-w-xs">{description}</p>}
    </div>
  )
}
