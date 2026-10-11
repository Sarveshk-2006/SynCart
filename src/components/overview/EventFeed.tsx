/**
 * EventFeed — chronological shopping event timeline.
 * Supports compact mode and item limiting for the Overview dashboard.
 */
import {
  ShoppingCart,
  ScanLine,
  Undo2,
  AlertTriangle,
  CheckCircle2,
  LogIn,
  LogOut,
  Info,
  type LucideIcon,
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { ShoppingEvent } from '@/types/domain'

interface EventFeedProps {
  events: ShoppingEvent[]
  limit?: number
  compact?: boolean
}

const eventConfig: Record<string, { icon: LucideIcon; label: string; iconBg: string; iconColor: string }> = {
  product_picked: {
    icon: ShoppingCart,
    label: 'Physical Pick',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  barcode_scanned: {
    icon: ScanLine,
    label: 'Barcode Scan',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
  },
  product_returned: {
    icon: Undo2,
    label: 'Return to Shelf',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
  },
  product_moved: {
    icon: ShoppingCart,
    label: 'Item Moved',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  product_swapped: {
    icon: ShoppingCart,
    label: 'Item Swapped',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  sku_mismatch: {
    icon: AlertTriangle,
    label: 'Discrepancy Flag',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  reconciliation_complete: {
    icon: CheckCircle2,
    label: 'Cart Matched',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  reconciliation_evaluated: {
    icon: CheckCircle2,
    label: 'Reconciliation Evaluated',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
  },
  discrepancy_resolved: {
    icon: CheckCircle2,
    label: 'Discrepancy Cleared',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  verification_requested: {
    icon: AlertTriangle,
    label: 'Verification Case',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  exit_verification_requested: {
    icon: AlertTriangle,
    label: 'Exit Verification',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  exit_pass_issued: {
    icon: CheckCircle2,
    label: 'Exit Pass Issued',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  exit_completed: {
    icon: LogOut,
    label: 'Turnstile Released',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  session_started: {
    icon: LogIn,
    label: 'Session Started',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  session_exited: {
    icon: LogOut,
    label: 'Session Exited',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
}

export function EventFeed({ events, limit, compact = false }: EventFeedProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )

  const displayEvents = limit ? sorted.slice(0, limit) : sorted

  if (displayEvents.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        No recent events recorded.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-slate-100" aria-label="Recent shopping events">
      {displayEvents.map((event) => {
        const config = eventConfig[event.type] ?? {
          icon: Info,
          label: event.type.replace(/_/g, ' '),
          iconBg: 'bg-slate-100',
          iconColor: 'text-slate-500',
        }
        const Icon = config.icon

        return (
          <li
            key={event.id}
            className={cn(
              'flex items-center gap-2.5 transition-colors hover:bg-slate-50/70',
              compact ? 'py-2 px-1' : 'py-2.5 px-1.5',
            )}
            aria-label={`${config.label}: ${event.description}`}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-md flex items-center justify-center shrink-0',
                config.iconBg,
              )}
              aria-hidden="true"
            >
              <Icon className={cn('w-3 h-3', config.iconColor)} />
            </div>

            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {config.label}
                  </span>
                  {event.productName && (
                    <span className="text-xs text-slate-600 truncate hidden sm:inline">
                      · {event.productName}
                    </span>
                  )}
                  {event.sku && (
                    <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                      ({event.sku})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate leading-tight">
                  {event.description}
                </p>
              </div>

              <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                {formatRelativeTime(event.occurredAt)}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
