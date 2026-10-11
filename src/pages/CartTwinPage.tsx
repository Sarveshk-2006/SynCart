/**
 * Cart Twin — Module C
 *
 * Dedicated digital–physical cart reconciliation interface:
 * - Session selector across all store sessions
 * - Synchronized side-by-side or unified reconciliation view
 * - Item discrepancy highlighting & interactive resolution
 * - Product observation confidence inspector drawer
 * - Printable audit slip export modal
 */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  GitCompare,
  ShoppingCart,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Search,
  ChevronRight,
  Layers,
  MapPin,
  Clock,
  Printer,
  X,
  LogOut,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SessionStatusBadge } from '@/components/ui/StatusBadge'
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { DEMO_SESSIONS, CART_TWIN_BY_SESSION, formatTimestamp } from '@/data/demo'
import { formatCurrency, cn } from '@/lib/utils'
import type { CartTwin, Discrepancy, Product, CartItem, PhysicalInteraction } from '@/types/domain'
import { useReconciliation, ACTIVE_SESSION_ID } from '@/context/ReconciliationContext'

type ViewMode = 'unified' | 'split' | 'discrepancies'

export function CartTwinPage() {
  const {
    activeSessionId,
    activeSession,
    allSessions,
    digitalItems: liveDigital,
    physicalItems: livePhysical,
    uncertainObservations,
    reconciliation,
    resolveDiscrepancy,
    resetInteractiveSession,
    exitState,
  } = useReconciliation()

  const [selectedSessionId, setSelectedSessionId] = useState<string>(ACTIVE_SESSION_ID)
  const [viewMode, setViewMode] = useState<ViewMode>('unified')
  const [itemSearch, setItemSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<{
    product: Product
    digitalItem?: CartItem
    physicalItem?: PhysicalInteraction
    discrepancy?: Discrepancy
  } | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isRevalidating, setIsRevalidating] = useState(false)
  const [resolvedDiscrepancies, setResolvedDiscrepancies] = useState<Record<string, string>>({})
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)

  const isInteractive = selectedSessionId === activeSessionId

  // Current session & cart twin
  const currentSession = useMemo(() => {
    if (isInteractive) return activeSession
    return allSessions.find((s) => s.id === selectedSessionId) || DEMO_SESSIONS[0]
  }, [isInteractive, activeSession, allSessions, selectedSessionId])

  const initialTwin: CartTwin = useMemo(() => {
    if (isInteractive) {
      return {
        sessionId: activeSessionId,
        digital: liveDigital,
        physical: livePhysical,
        discrepancies: reconciliation.discrepancies,
      }
    }
    return (
      CART_TWIN_BY_SESSION[selectedSessionId] || {
        sessionId: selectedSessionId,
        digital: [],
        physical: [],
        discrepancies: [],
      }
    )
  }, [isInteractive, activeSessionId, liveDigital, livePhysical, reconciliation.discrepancies, selectedSessionId])

  // Filtered active discrepancies accounting for local resolutions
  const activeDiscrepancies = useMemo(() => {
    if (isInteractive) return reconciliation.discrepancies
    return initialTwin.discrepancies.filter((d) => !resolvedDiscrepancies[`${selectedSessionId}_${d.sku}`])
  }, [isInteractive, reconciliation.discrepancies, initialTwin.discrepancies, resolvedDiscrepancies, selectedSessionId])

  const discrepancySKUs = useMemo(() => {
    return new Set(activeDiscrepancies.map((d) => d.sku))
  }, [activeDiscrepancies])

  // Metrics calculation
  const digitalSubtotal = useMemo(() => {
    return initialTwin.digital.reduce((acc, i) => acc + i.product.priceUsd * i.quantity, 0)
  }, [initialTwin.digital])

  const physicalSubtotal = useMemo(() => {
    return initialTwin.physical.reduce((acc, i) => acc + i.product.priceUsd * i.quantity, 0)
  }, [initialTwin.physical])

  const valueDelta = Math.abs(digitalSubtotal - physicalSubtotal)
  const totalItemCount = Math.max(initialTwin.digital.length, initialTwin.physical.length)
  const matchedCount = totalItemCount - activeDiscrepancies.length
  const matchRate = totalItemCount > 0 ? Math.round((matchedCount / totalItemCount) * 100) : 100

  // Combine unified rows for comparison table
  const unifiedRows = useMemo(() => {
    const map = new Map<
      string,
      {
        product: Product
        digital?: CartItem
        physical?: PhysicalInteraction
        discrepancy?: Discrepancy
      }
    >()

    initialTwin.digital.forEach((item) => {
      map.set(item.product.sku, { product: item.product, digital: item })
    })

    initialTwin.physical.forEach((item) => {
      const existing = map.get(item.product.sku)
      if (existing) {
        existing.physical = item
      } else {
        map.set(item.product.sku, { product: item.product, physical: item })
      }
    })

    initialTwin.discrepancies.forEach((disc) => {
      const existing = map.get(disc.sku)
      if (existing) {
        existing.discrepancy = disc
      }
    })

    let rows = Array.from(map.values())
    if (itemSearch.trim()) {
      const q = itemSearch.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.product.name.toLowerCase().includes(q) ||
          r.product.sku.toLowerCase().includes(q) ||
          r.product.category.toLowerCase().includes(q),
      )
    }

    return rows
  }, [initialTwin, itemSearch])

  // Handlers
  const handleResolveDiscrepancy = (sku: string, reason: string) => {
    if (isInteractive) {
      if (reason.toLowerCase().includes('return')) {
        resolveDiscrepancy({ action: 'confirm_return', sku, note: 'Returned to shelf' })
      } else if (reason.toLowerCase().includes('scan')) {
        resolveDiscrepancy({ action: 'scan_item', sku, note: 'Scanned missing item' })
      } else {
        resolveDiscrepancy({ action: 'operator_verify', sku, note: reason })
      }
      setFeedbackNotice(`Discrepancy for SKU ${sku} resolved in live reconciliation engine.`)
      setTimeout(() => setFeedbackNotice(null), 3500)
      if (selectedProduct?.product.sku === sku) {
        setSelectedProduct(null)
      }
      return
    }

    setResolvedDiscrepancies((prev) => ({
      ...prev,
      [`${selectedSessionId}_${sku}`]: reason,
    }))
    setFeedbackNotice(`Discrepancy for SKU ${sku} marked as: ${reason}`)
    setTimeout(() => setFeedbackNotice(null), 4000)
    if (selectedProduct?.product.sku === sku) {
      setSelectedProduct(null)
    }
  }

  const handleRevalidateSensors = () => {
    setIsRevalidating(true)
    setTimeout(() => {
      setIsRevalidating(false)
      setFeedbackNotice('Shelf sensor telemetry re-synchronized with live reconciliation engine.')
      setTimeout(() => setFeedbackNotice(null), 4000)
    }, 600)
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Cart Twin"
        subtitle="Digital customer scans vs physical shelf observations with line-by-line discrepancy resolution."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleRevalidateSensors}
            disabled={isRevalidating}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs',
              isRevalidating && 'opacity-70 cursor-not-allowed',
            )}
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-slate-500', isRevalidating && 'animate-spin')} />
            <span>{isRevalidating ? 'Querying Sensors…' : 'Re-sync Telemetry'}</span>
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-medium text-white transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Audit Slip</span>
          </button>
        </div>
      </PageHeader>

      {/* Feedback Toast */}
      {feedbackNotice && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Session Selector Strip */}
      <div className="mb-4 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Select Active Shopping Session
          </span>
          <span className="text-xs text-slate-400">
            {allSessions.length} registered sessions in demo store
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {allSessions.slice(0, 4).map((s) => {
            const isSelected = s.id === selectedSessionId
            const isLive = s.id === activeSessionId
            const twin = isLive ? initialTwin : CART_TWIN_BY_SESSION[s.id]
            const discs = isLive ? activeDiscrepancies.length : (twin?.discrepancies.length ?? 0)
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                className={cn(
                  'flex flex-col p-2.5 rounded-lg border text-left transition-all',
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60',
                )}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{s.shopperLabel}</span>
                    {isLive && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                        Live Engine
                      </span>
                    )}
                  </div>
                  <SessionStatusBadge status={s.status} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{s.itemCount} items scanned</span>
                  {discs > 0 ? (
                    <span className="text-amber-600 font-semibold">{discs} mismatch</span>
                  ) : (
                    <span className="text-emerald-600 font-medium">Reconciled</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Interactive Status & Reset Banner */}
      {isInteractive ? (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Active Interactive Session (Cart #A7F3):</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    exitState === 'COMPLETED'
                      ? 'bg-slate-200 text-slate-800'
                      : exitState === 'VERIFIED'
                        ? 'bg-emerald-200 text-emerald-900'
                        : exitState === 'BLOCKED'
                          ? 'bg-amber-200 text-amber-900 animate-pulse'
                          : exitState === 'READY'
                            ? 'bg-blue-200 text-blue-900'
                            : 'bg-slate-200 text-slate-700',
                  )}
                >
                  Exit State: {exitState}
                </span>
              </div>
              <span className="text-emerald-800 text-[11px] block mt-0.5">
                Synchronized with Customer App and Exit Gate.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/exit-verification"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Gate Monitor</span>
            </Link>
            <button
              onClick={() => {
                resetInteractiveSession()
                setFeedbackNotice('Interactive session reset to baseline clean MATCH state.')
                setTimeout(() => setFeedbackNotice(null), 3500)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-semibold text-xs shadow-2xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reset Session</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div>
            <span className="font-bold">Historical Fixture ({currentSession.shopperLabel})</span> ·{' '}
            <span className="text-slate-500">Read-only audit record.</span>
          </div>
          <button
            onClick={() => setSelectedSessionId(activeSessionId)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs self-start sm:self-auto transition-colors"
          >
            <span>Switch to Active Session ({activeSessionId})</span>
          </button>
        </div>
      )}

      {/* Uncertain Observations Alert Card */}
      {isInteractive && uncertainObservations.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Uncertain Observations ({uncertainObservations.length})</span>
          </div>
          <p className="text-amber-800">
            Detections below 70% confidence threshold requiring operator confirmation:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {uncertainObservations.map((obs) => (
              <div
                key={obs.id}
                className="p-3 bg-white rounded-lg border border-amber-200 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{obs.product.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {obs.product.sku} · {obs.confidence}% confidence · {obs.shelfZoneLabel}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleResolveDiscrepancy(obs.product.sku, 'operator_verify')}
                    className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => resolveDiscrepancy({ action: 'dismiss_uncertain', sku: obs.product.sku })}
                    className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Metrics Summary */}
      <section aria-label="Reconciliation summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Digital Scans"
          value={initialTwin.digital.reduce((a, b) => a + b.quantity, 0)}
          description={`Subtotal: ${formatCurrency(digitalSubtotal)}`}
          icon={ShoppingCart}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
        <MetricCard
          label="Physical Observations"
          value={initialTwin.physical.reduce((a, b) => a + b.quantity, 0)}
          description={`Observed: ${formatCurrency(physicalSubtotal)}`}
          icon={Zap}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <MetricCard
          label="Value Delta"
          value={formatCurrency(valueDelta)}
          description={valueDelta === 0 ? 'Exact balance' : 'Discrepancy at checkout'}
          icon={AlertTriangle}
          iconColor={valueDelta > 0 ? 'text-amber-600' : 'text-slate-500'}
          iconBg={valueDelta > 0 ? 'bg-amber-50' : 'bg-slate-100'}
        />
        <MetricCard
          label="Reconciliation Rate"
          value={`${matchRate}%`}
          description={`${activeDiscrepancies.length} discrepancy open`}
          icon={CheckCircle2}
          iconColor={matchRate === 100 ? 'text-emerald-600' : 'text-indigo-600'}
          iconBg={matchRate === 100 ? 'bg-emerald-50' : 'bg-indigo-50'}
        />
      </section>

      {/* View Toggles & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        {/* View Mode Buttons */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setViewMode('unified')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 sm:flex-initial flex items-center justify-center gap-1.5',
              viewMode === 'unified'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Unified Table</span>
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 sm:flex-initial flex items-center justify-center gap-1.5',
              viewMode === 'split'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
          <button
            onClick={() => setViewMode('discrepancies')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 sm:flex-initial flex items-center justify-center gap-1.5',
              viewMode === 'discrepancies'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Discrepancies ({activeDiscrepancies.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="search"
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            placeholder="Filter items or SKU…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'unified' && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Unified Reconciliation Audit — {currentSession.shopperLabel}
              </h2>
              <p className="text-xs text-slate-400">
                Comparing customer barcode scan events against simulated shelf interaction detections.
              </p>
            </div>
            <Badge variant="muted">{unifiedRows.length} distinct products</Badge>
          </CardHeader>
          <CardBody className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-4">Product / SKU</th>
                  <th className="py-2.5 px-4 text-center">Digital Scan</th>
                  <th className="py-2.5 px-4 text-center">Physical Detection</th>
                  <th className="py-2.5 px-4">Detection Confidence</th>
                  <th className="py-2.5 px-4">Reconciliation Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unifiedRows.map((row) => {
                  const isMismatch = discrepancySKUs.has(row.product.sku)
                  const isResolved = Boolean(resolvedDiscrepancies[`${selectedSessionId}_${row.product.sku}`])
                  const confidence = row.physical?.observationConfidence ?? (row.digital ? 95 : 0)

                  return (
                    <tr
                      key={row.product.sku}
                      className={cn(
                        'hover:bg-slate-50/80 transition-colors',
                        isMismatch && 'bg-amber-50/40',
                      )}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl shrink-0" aria-hidden="true">
                            {row.product.imageEmoji}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">{row.product.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {row.product.sku} · {row.product.category} · {formatCurrency(row.product.priceUsd)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {row.digital ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold">
                            ×{row.digital.quantity}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">0 (Unscanned)</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {row.physical ? (
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-md font-semibold',
                              isMismatch ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700',
                            )}
                          >
                            ×{row.physical.quantity}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">0</span>
                        )}
                      </td>

                      <td className="py-3 px-4 w-40">
                        {row.physical ? (
                          <ConfidenceBar
                            score={confidence}
                            level={confidence >= 85 ? 'high' : confidence >= 60 ? 'medium' : 'low'}
                          />
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A (Scan only)</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isResolved ? (
                          <Badge variant="success" dot>
                            Resolved ({resolvedDiscrepancies[`${selectedSessionId}_${row.product.sku}`]})
                          </Badge>
                        ) : isMismatch ? (
                          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              {row.discrepancy?.reason.replace(/_/g, ' ') || 'Discrepancy'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Matched</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            setSelectedProduct({
                              product: row.product,
                              digitalItem: row.digital,
                              physicalItem: row.physical,
                              discrepancy: row.discrepancy,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-medium"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {viewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Digital Cart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-sky-50 flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Digital Cart (Customer Scans)</h3>
                  <p className="text-xs text-slate-400">Barcode scan entries</p>
                </div>
              </div>
              <Badge variant="info">{initialTwin.digital.length} line items</Badge>
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {initialTwin.digital.map((item) => {
                  const hasMismatch = discrepancySKUs.has(item.product.sku)
                  return (
                    <li
                      key={item.product.sku}
                      className={cn(
                        'px-4 py-3 flex items-center gap-3 transition-colors hover:bg-slate-50/50 cursor-pointer',
                        hasMismatch && 'bg-amber-50/50',
                      )}
                      onClick={() =>
                        setSelectedProduct({
                          product: item.product,
                          digitalItem: item,
                          physicalItem: initialTwin.physical.find((p) => p.product.sku === item.product.sku),
                          discrepancy: initialTwin.discrepancies.find((d) => d.sku === item.product.sku),
                        })
                      }
                    >
                      <span className="text-xl">{item.product.imageEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {item.product.sku} · {formatTimestamp(item.addedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-800">×{item.quantity}</p>
                        <p className="text-[11px] text-slate-400">
                          {formatCurrency(item.product.priceUsd * item.quantity)}
                        </p>
                      </div>
                      {hasMismatch ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </li>
                  )
                })}
              </ul>
            </CardBody>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-500">Digital Subtotal</span>
              <span className="text-slate-900 font-bold">{formatCurrency(digitalSubtotal)}</span>
            </div>
          </Card>

          {/* Physical Cart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Physical Cart (Shelf Telemetry)</h3>
                  <p className="text-xs text-slate-400">Sensors & computer vision</p>
                </div>
              </div>
              <Badge variant="success">{initialTwin.physical.length} observations</Badge>
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {initialTwin.physical.map((item) => {
                  const hasMismatch = discrepancySKUs.has(item.product.sku)
                  return (
                    <li
                      key={item.product.sku}
                      className={cn(
                        'px-4 py-3 flex items-center gap-3 transition-colors hover:bg-slate-50/50 cursor-pointer',
                        hasMismatch && 'bg-amber-50/50',
                      )}
                      onClick={() =>
                        setSelectedProduct({
                          product: item.product,
                          digitalItem: initialTwin.digital.find((d) => d.product.sku === item.product.sku),
                          physicalItem: item,
                          discrepancy: initialTwin.discrepancies.find((d) => d.sku === item.product.sku),
                        })
                      }
                    >
                      <span className="text-xl">{item.product.imageEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {item.sourceLabel || 'Shelf Sensor'} · {item.observationConfidence}% conf
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-800">×{item.quantity}</p>
                        <p className="text-[11px] text-slate-400">
                          {formatCurrency(item.product.priceUsd * item.quantity)}
                        </p>
                      </div>
                      {hasMismatch ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </li>
                  )
                })}
              </ul>
            </CardBody>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-500">Physical Detected Total</span>
              <span className="text-slate-900 font-bold">{formatCurrency(physicalSubtotal)}</span>
            </div>
          </Card>
        </div>
      )}

      {viewMode === 'discrepancies' && (
        <div className="space-y-4">
          {activeDiscrepancies.length === 0 ? (
            <Card>
              <CardBody className="py-12">
                <EmptyState
                  icon={CheckCircle2}
                  title="Cart is 100% Reconciled"
                  description="All customer scans match the simulated physical sensor detections. No active mismatches require operator resolution."
                />
                <div className="flex justify-center mt-3">
                  <button
                    onClick={() => setViewMode('unified')}
                    className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 shadow-xs"
                  >
                    View Unified Manifest
                  </button>
                </div>
              </CardBody>
            </Card>
          ) : (
            activeDiscrepancies.map((disc) => (
              <Card key={disc.sku} className="border-amber-200 bg-amber-50/20">
                <CardHeader className="bg-amber-50/50 border-b border-amber-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <div>
                      <h3 className="text-sm font-semibold text-amber-900">
                        {disc.productName} <span className="font-mono text-xs font-normal">({disc.sku})</span>
                      </h3>
                      <p className="text-xs text-amber-700">
                        Reason: {disc.reason.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning" dot>
                    Active Discrepancy
                  </Badge>
                </CardHeader>
                <CardBody className="p-4 space-y-3">
                  <p className="text-xs text-slate-700 leading-relaxed">{disc.description}</p>
                  {disc.resolution && (
                    <div className="p-2.5 rounded-lg bg-white border border-amber-200/80 text-xs text-amber-900">
                      <span className="font-semibold text-amber-800">Recommended action:</span>{' '}
                      {disc.resolution}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-100">
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span>
                        Digital: <strong className="text-slate-900">×{disc.digitalQty}</strong>
                      </span>
                      <span>
                        Physical: <strong className="text-slate-900">×{disc.physicalQty}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolveDiscrepancy(disc.sku, 'Reconciled as Matched')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs"
                      >
                        Approve & Match
                      </button>
                      <button
                        onClick={() => handleResolveDiscrepancy(disc.sku, 'Flagged for Exit Lane Inspection')}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-xs"
                      >
                        Send to Exit Check
                      </button>
                      <button
                        onClick={() => handleResolveDiscrepancy(disc.sku, 'Dismissed as False Alarm')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium"
                      >
                        Dismiss False Alarm
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Item Deep-Dive Drawer */}
      <Drawer
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.product.name || 'Product Details'}
        subtitle={`SKU: ${selectedProduct?.product.sku || ''}`}
        width="lg"
      >
        {selectedProduct && (
          <div className="p-5 space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-4xl p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                {selectedProduct.product.imageEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {selectedProduct.product.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedProduct.product.sku} · {selectedProduct.product.category}
                </p>
                <p className="text-sm font-semibold text-emerald-600 mt-1">
                  {formatCurrency(selectedProduct.product.priceUsd)} / unit
                </p>
              </div>
            </div>

            {/* Comparison Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Digital Scans
                </span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  ×{selectedProduct.digitalItem?.quantity || 0}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {selectedProduct.digitalItem
                    ? `Scanned at ${formatTimestamp(selectedProduct.digitalItem.addedAt)}`
                    : 'No scan recorded in cart'}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Physical Telemetry
                </span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  ×{selectedProduct.physicalItem?.quantity || 0}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {selectedProduct.physicalItem
                    ? `Observed at ${formatTimestamp(selectedProduct.physicalItem.detectedAt)}`
                    : 'No shelf interaction event'}
                </p>
              </div>
            </div>

            {/* Shelf Sensor Telemetry Metadata */}
            {selectedProduct.physicalItem && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Sensor Confidence Score</span>
                  <Badge
                    variant={
                      (selectedProduct.physicalItem.observationConfidence ?? 0) >= 80
                        ? 'success'
                        : 'warning'
                    }
                  >
                    {selectedProduct.physicalItem.observationConfidence ?? 0}%
                  </Badge>
                </div>
                <ConfidenceBar
                  score={selectedProduct.physicalItem.observationConfidence ?? 0}
                  level={
                    (selectedProduct.physicalItem.observationConfidence ?? 0) >= 80
                      ? 'high'
                      : (selectedProduct.physicalItem.observationConfidence ?? 0) >= 60
                        ? 'medium'
                        : 'low'
                  }
                />
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedProduct.physicalItem.sourceLabel || 'Shelf Zone'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatTimestamp(selectedProduct.physicalItem.detectedAt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Discrepancy & Resolution Box */}
            {selectedProduct.discrepancy && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Flagged Discrepancy: {selectedProduct.discrepancy.reason.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {selectedProduct.discrepancy.description}
                </p>

                <div className="pt-2 border-t border-amber-200 flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-amber-900">Resolve this item:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        handleResolveDiscrepancy(selectedProduct.product.sku, 'Reconciled as Matched')
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                    >
                      Confirm Match
                    </button>
                    <button
                      onClick={() =>
                        handleResolveDiscrepancy(selectedProduct.product.sku, 'Flagged for Exit Audit')
                      }
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium"
                    >
                      Flag for Exit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Printable Audit Slip Modal */}
      {isExportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <FileText className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Cart Reconciliation Audit Slip</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Official store audit certificate for {currentSession.shopperLabel} ({currentSession.id}).
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs space-y-2 mb-4">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>STORE #GFM-001</span>
                <span>GREENFIELD MARKET</span>
              </div>
              <div className="flex justify-between">
                <span>SESSION ID:</span>
                <span className="font-bold">{currentSession.id}</span>
              </div>
              <div className="flex justify-between">
                <span>CART REF:</span>
                <span>{currentSession.cartId}</span>
              </div>
              <div className="flex justify-between">
                <span>DIGITAL SCANS:</span>
                <span>{initialTwin.digital.reduce((a, b) => a + b.quantity, 0)} items</span>
              </div>
              <div className="flex justify-between">
                <span>DIGITAL TOTAL:</span>
                <span>{formatCurrency(digitalSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>PHYSICAL TOTAL:</span>
                <span>{formatCurrency(physicalSubtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span>DISCREPANCY DELTA:</span>
                <span className={valueDelta > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                  {formatCurrency(valueDelta)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print()
                  setIsExportModalOpen(false)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-medium text-white shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Audit Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
