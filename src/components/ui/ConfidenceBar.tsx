/**
 * ConfidenceBar — horizontal bar showing a 0–100 confidence score.
 */
import { cn } from '@/lib/utils'
import type { ConfidenceLevel } from '@/types/domain'

interface ConfidenceBarProps {
  score: number
  level: ConfidenceLevel
  showLabel?: boolean
  className?: string
}

const barColor: Record<ConfidenceLevel, string> = {
  high:   'bg-emerald-500',
  medium: 'bg-amber-400',
  low:    'bg-rose-400',
}

const textColor: Record<ConfidenceLevel, string> = {
  high:   'text-emerald-700',
  medium: 'text-amber-700',
  low:    'text-rose-600',
}

export function ConfidenceBar({ score, level, showLabel = true, className }: ConfidenceBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence: ${score}%`}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor[level])}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium tabular-nums shrink-0', textColor[level])}>
          {score}%
        </span>
      )}
    </div>
  )
}
