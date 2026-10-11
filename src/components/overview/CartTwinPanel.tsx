/**
 * CartTwinPanel — Compact active-session Cart Twin preview for the Overview command center.
 *
 * Displays:
 * - Active cart & session identifier
 * - Live reconciliation status badge
 * - Digital item count & subtotal vs Physical item count & detected total
 * - Top active discrepancy banner if present
 * - Up to 3 item preview rows with "+N more" link
 * - Direct link to full Cart Twin page
 */
import { Link } from 'react-router-dom'
import {
  GitCompare,
  ShoppingCart,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, cn } from '@/lib/utils'
import type { ReconciledItem, ReconciliationDiscrepancy, ReconciliationStatus } from '@/types/domain'

interface CartTwinPanelProps {
  sessionId: string
  cartLabel: string
  status: ReconciliationStatus
  digitalCount: number
  digitalTotal: number
  physicalCount: number
  physicalTotal: number
  discrepancies: ReconciliationDiscrepancy[]
  items: ReconciledItem[]
}

export function CartTwinPanel({
  sessionId,
  cartLabel,
  status,
  digitalCount,
  digitalTotal,
  physicalCount,
  physicalTotal,
  discrepancies,
  items,
}: CartTwinPanelProps) {
  // Sort items so discrepant items appear first in the preview
  const previewItems = [...items]
    .sort((a, b) => {
      const aDisc = a.matchStatus !== 'matched' ? 1 : 0
      const bDisc = b.matchStatus !== 'matched' ? 1 : 0
      return bDisc - aDisc
    })
    .slice(0, 3)

  const remainingCount = items.length - previewItems.length
  const hasDiscrepancy = discrepancies.length > 0 || status === 'MISMATCH'

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-[var(--shadow-card)] p-4">
      {/* ── Top Header Row ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <GitCompare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-900 tracking-tight">Active Cart Twin</span>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {cartLabel}
              </span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                ({sessionId})
              </span>
              <Badge
                variant={
                  status === 'MATCH'
                    ? 'success'
                    : status === 'MISMATCH'
                      ? 'danger'
                      : 'warning'
                }
                dot
              >
                {status === 'MATCH'
                  ? 'Matched'
                  : status === 'MISMATCH'
                    ? `${discrepancies.length} Discrepancy`
                    : 'Uncertain'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right side: Summary pill & link */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <ShoppingCart className="w-3.5 h-3.5 text-sky-500" />
              <span>Digital:</span>
              <strong className="text-slate-900 font-mono font-semibold">{digitalCount}</strong>
              <span className="text-slate-400">({formatCurrency(digitalTotal)})</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              <span>Physical:</span>
              <strong className="text-slate-900 font-mono font-semibold">{physicalCount}</strong>
              <span className="text-slate-400">({formatCurrency(physicalTotal)})</span>
            </span>
          </div>

          <Link
            to="/cart-twin"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <span>Full Cart Twin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Discrepancy Alert Strip (if active) ───────────────── */}
      {hasDiscrepancy && discrepancies.length > 0 && (
        <div className="mt-3 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold truncate">
              {discrepancies[0].productName}:
            </span>
            <span className="text-amber-800 truncate">
              Scanned ×{discrepancies[0].digitalQty} vs Observed ×{discrepancies[0].physicalQty}
            </span>
          </div>
          <Link
            to="/cart-twin"
            className="text-xs font-bold text-amber-800 underline hover:text-amber-950 shrink-0 ml-2"
          >
            Resolve
          </Link>
        </div>
      )}

      {/* ── 3 Item Preview Grid / List ────────────────────────── */}
      <div className="mt-3">
        {items.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No items in active session cart yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {previewItems.map((item) => {
              const isMismatch = item.matchStatus !== 'matched' && item.matchStatus !== 'uncertain'
              const isUncertain = item.matchStatus === 'uncertain'

              return (
                <div
                  key={item.product.sku}
                  className={cn(
                    'p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between gap-2',
                    isMismatch
                      ? 'bg-amber-50/60 border-amber-200'
                      : isUncertain
                        ? 'bg-sky-50/50 border-sky-200'
                        : 'bg-slate-50/60 border-slate-200/80',
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0 select-none">{item.product.imageEmoji}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate leading-tight">
                        {item.product.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {item.product.sku}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 font-mono text-xs justify-end">
                      <span className="text-slate-600">D:×{item.digitalQty}</span>
                      <span className="text-slate-300">/</span>
                      <span className={cn('font-semibold', isMismatch ? 'text-amber-700' : 'text-slate-800')}>
                        P:×{item.physicalQty}
                      </span>
                    </div>
                    <div className="mt-0.5 flex justify-end">
                      {isMismatch ? (
                        <span className="text-[10px] font-bold text-amber-700 uppercase">Mismatch</span>
                      ) : isUncertain ? (
                        <span className="text-[10px] font-medium text-sky-700">Uncertain</span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Matched</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer info: +N more items link */}
        {remainingCount > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing 3 of {items.length} items in session cart
            </span>
            <Link
              to="/cart-twin"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              +{remainingCount} more items →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
