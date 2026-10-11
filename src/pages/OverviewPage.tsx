/**
 * OverviewPage — High-density, compact operational command center for SYNCART.
 *
 * Designed to fit comfortably in a 1440x900 viewport with:
 * A. Compact page header with truthful status indicator
 * B. 4 compact, equal-height KPI cards from live reconciliation state
 * C. Compact active-session Cart Twin preview (with up to 3 items and top discrepancy)
 * D. Balanced two-column operational layout: Recent Events (max 5) & Needs Review (open cases only)
 * E. Compact collapsible disclosure for the 5-stage pipeline diagram
 */
import { Link } from 'react-router-dom'
import {
  Activity,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  Clock,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { useReconciliation } from '@/context/ReconciliationContext'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { CartTwinPanel } from '@/components/overview/CartTwinPanel'
import { EventFeed } from '@/components/overview/EventFeed'
import { VerificationQueue } from '@/components/overview/VerificationQueue'
import { WorkflowDiagram } from '@/components/overview/WorkflowDiagram'

export function OverviewPage() {
  const {
    activeSessionId,
    activeCartLabel,
    activeStoreName,
    reconciliationStatus,
    digitalItemCount,
    digitalTotal,
    physicalItemCount,
    physicalTotal,
    discrepancies,
    reconciledRows,
    allSessions,
    allEvents,
    allVerificationCases,
  } = useReconciliation()

  // Derived truthful metrics from shared state
  const activeSessionsCount = allSessions.filter((s) => s.status !== 'exited').length
  const reconciledSessionsCount = allSessions.filter((s) => s.status === 'reconciled').length
  const pendingReviewCount = allVerificationCases.filter(
    (c) => c.status === 'pending' || c.status === 'in_review',
  ).length
  const resolvedCount = allVerificationCases.filter((c) => c.status === 'resolved').length

  const hasOpenDiscrepancies = discrepancies.length > 0 || reconciliationStatus === 'MISMATCH'

  return (
    <div className="px-4 sm:px-6 py-4 max-w-[1400px] mx-auto space-y-4">
      {/* ── A. Compact Page Header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Store Overview</h1>
          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md select-none">
            {activeStoreName || 'Greenfield Market'} · Terminal 01
          </span>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded uppercase tracking-wider select-none">
            Demo
          </span>
        </div>

        {/* Truthful status indicator based on actual reconciliation state */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasOpenDiscrepancies ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{discrepancies.length} Active Discrepancy</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All Carts In Sync</span>
            </span>
          )}
        </div>
      </div>

      {/* ── B. Four Compact KPI Cards ──────────────────────── */}
      <section aria-label="Key performance indicators" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[var(--shadow-card)] px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              {activeSessionsCount}
            </p>
            <p className="text-xs font-medium text-slate-600 mt-1">Active Sessions</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[var(--shadow-card)] px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              {reconciledSessionsCount}
            </p>
            <p className="text-xs font-medium text-slate-600 mt-1">Reconciled</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[var(--shadow-card)] px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              {pendingReviewCount}
            </p>
            <p className="text-xs font-medium text-slate-600 mt-1">Pending Review</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[var(--shadow-card)] px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              {resolvedCount}
            </p>
            <p className="text-xs font-medium text-slate-600 mt-1">Resolved Today</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* ── C. Compact Active-Session Cart Twin Preview ─────── */}
      <section aria-labelledby="cart-twin-heading">
        <CartTwinPanel
          sessionId={activeSessionId}
          cartLabel={activeCartLabel}
          status={reconciliationStatus}
          digitalCount={digitalItemCount}
          digitalTotal={digitalTotal}
          physicalCount={physicalItemCount}
          physicalTotal={physicalTotal}
          discrepancies={discrepancies}
          items={reconciledRows}
        />
      </section>

      {/* ── D. Two-Column Operational Layout ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Events (max 5) */}
        <Card className="flex flex-col">
          <CardHeader className="py-2.5 px-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Recent Events</h2>
            </div>
            <Link
              to="/timeline"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              View timeline →
            </Link>
          </CardHeader>
          <CardBody className="py-1 px-3 flex-1 overflow-hidden">
            <EventFeed events={allEvents} limit={5} compact />
          </CardBody>
        </Card>

        {/* Needs Review (open cases only, max 3) */}
        <Card className="flex flex-col">
          <CardHeader className="py-2.5 px-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Needs Review</h2>
              {pendingReviewCount > 0 && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200">
                  {pendingReviewCount}
                </span>
              )}
            </div>
            <Link
              to="/verification"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              View queue →
            </Link>
          </CardHeader>
          <CardBody className="py-2 px-3 flex-1 overflow-hidden">
            <VerificationQueue cases={allVerificationCases} limit={3} />
          </CardBody>
        </Card>
      </div>

      {/* ── E. Compact Architecture Disclosure ─────────────── */}
      <details className="group rounded-xl border border-slate-200/80 bg-white text-xs overflow-hidden shadow-2xs">
        <summary className="px-4 py-2 font-medium text-slate-500 hover:text-slate-800 cursor-pointer select-none flex items-center justify-between transition-colors list-none">
          <span className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>How SYNCART Works (5-stage reconciliation pipeline)</span>
          </span>
          <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform font-mono">
            ▼
          </span>
        </summary>
        <div className="p-4 pt-1 border-t border-slate-100">
          <WorkflowDiagram />
        </div>
      </details>
    </div>
  )
}
