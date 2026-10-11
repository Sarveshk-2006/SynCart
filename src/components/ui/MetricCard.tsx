/**
 * MetricCard — displays a single KPI tile with label, value, delta, and icon.
 */
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number | string
  delta?: number
  unit?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  className?: string
  description?: string
}

export function MetricCard({
  label,
  value,
  delta,
  unit,
  icon: Icon,
  iconColor = 'text-emerald-600',
  iconBg = 'bg-emerald-50',
  className,
  description,
}: MetricCardProps) {
  const isPositive = delta !== undefined && delta > 0
  const isNegative = delta !== undefined && delta < 0
  const deltaAbs = delta !== undefined ? Math.abs(delta) : 0

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/90 shadow-[var(--shadow-card)]',
        'px-4 py-3.5 flex flex-col justify-between transition-all duration-150 ease-out hover:shadow-sm hover:border-slate-300',
        className,
      )}
      role="region"
      aria-label={label}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} aria-hidden="true" />
        </div>
        {delta !== undefined && (
          <span
            className={cn(
              'text-[11px] font-medium px-2 py-0.5 rounded-full border',
              isPositive && 'text-emerald-700 bg-emerald-50/80 border-emerald-200/60',
              isNegative && 'text-rose-600 bg-rose-50/80 border-rose-200/60',
              !isPositive && !isNegative && 'text-slate-500 bg-slate-100 border-slate-200',
            )}
            aria-label={`${isPositive ? 'Up' : isNegative ? 'Down' : 'No change'} ${deltaAbs} from previous period`}
          >
            {isPositive ? '↑' : isNegative ? '↓' : '—'} {deltaAbs}
          </span>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
          {value}
          {unit && <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>}
        </p>
        <p className="text-xs font-medium text-slate-600 mt-1">{label}</p>
        {description && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{description}</p>
        )}
      </div>
    </div>
  )
}
