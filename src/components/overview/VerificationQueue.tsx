/**
 * VerificationQueue — Shows active, open verification cases requiring operator attention.
 * Compact mode for Overview dashboard.
 */
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'
import type { VerificationCase, MismatchReason } from '@/types/domain'

interface VerificationQueueProps {
  cases: VerificationCase[]
  limit?: number
}

const mismatchLabels: Record<MismatchReason, string> = {
  quantity_discrepancy: 'Qty Discrepancy',
  unscanned_item:       'Unscanned Item',
  wrong_sku:            'Wrong SKU',
  extra_item_in_cart:   'Extra Item',
  item_not_in_cart:     'Missing Item',
}

const priorityBadge: Record<'high' | 'medium' | 'low', 'danger' | 'warning' | 'muted'> = {
  high:   'danger',
  medium: 'warning',
  low:    'muted',
}

export function VerificationQueue({ cases, limit = 3 }: VerificationQueueProps) {
  // Filter for OPEN cases only (pending or in_review)
  const openCases = cases.filter((c) => c.status === 'pending' || c.status === 'in_review')

  // Sort so highest priority comes first
  const sortedCases = [...openCases].sort((a, b) => {
    const pWeight = { high: 3, medium: 2, low: 1 }
    return pWeight[b.priority] - pWeight[a.priority]
  })

  const displayCases = sortedCases.slice(0, limit)

  if (displayCases.length === 0) {
    return (
      <div className="py-6 flex flex-col items-center justify-center text-center">
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <p className="text-xs font-semibold text-slate-800">No Open Cases</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          All cart observations are verified. System normal.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2" aria-label="Open verification cases">
      {displayCases.map((c) => (
        <li key={c.id}>
          <Link
            to="/verification"
            className="group flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs transition-all duration-150 block"
            aria-label={`Verification case: ${c.affectedProductName || c.shopperLabel}`}
          >
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {c.affectedProductName || c.shopperLabel}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={priorityBadge[c.priority]} className="text-[10px] px-1.5 py-0">
                    {c.priority.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] font-mono text-slate-400">
                    {c.confidenceScore}% conf
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                <span className="font-mono text-slate-600">
                  {c.shopperLabel}
                </span>
                <span className="text-slate-300">·</span>
                <span className="truncate">
                  {mismatchLabels[c.mismatchReason] || c.mismatchReason}
                </span>
                <span className="text-[10px] text-slate-400 font-mono ml-auto shrink-0">
                  {formatRelativeTime(c.createdAt)}
                </span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 self-center transition-colors" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
