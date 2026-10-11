/**
 * Exit Verification & Turnstile Monitoring Console — Phase 5
 *
 * Provides real-time store operator oversight at self-checkout exit gates:
 * - Monitors approaching carts and their live exit verification state
 * - State machine indicator: NOT_REQUESTED, BLOCKED, READY, VERIFIED, COMPLETED
 * - Turnstile hardware state: LOCKED (Hold) vs RELEASED (Cleared)
 * - Evidence inspection for exit-blocking discrepancies and uncertain observations
 * - Supported operator corrective actions (Manual Inspection, Scan missing, Confirm return, Dismiss false positive)
 * - Digital Exit Pass inspection with audit checksum
 * - Live auditable exit event stream
 */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  QrCode,
  Layers,
  Clock,
  RefreshCw,
  Barcode,
  Check,
  X,
  Smartphone,
  ChevronRight,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { formatCurrency, cn } from '@/lib/utils'
import { useReconciliation } from '@/context/ReconciliationContext'

export function ExitVerificationPage() {
  const {
    activeSessionId,
    activeCartLabel,
    reconciliationStatus,
    discrepancies,
    digitalTotal,
    digitalItemCount,
    physicalItemCount,
    exitState,
    exitPass,
    isSessionCompleted,
    resolveDiscrepancy,
    completeExitJourney,
    resetInteractiveSession,
    allEvents,
  } = useReconciliation()

  const [operatorNote, setOperatorNote] = useState('')
  const [selectedSku, setSelectedSku] = useState<string | null>(null)
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null)
  const [isSimulatingGateScan, setIsSimulatingGateScan] = useState(false)

  // Filter exit-related events for the gate audit log
  const exitAuditEvents = useMemo(() => {
    return allEvents
      .filter((e) =>
        [
          'exit_verification_requested',
          'exit_pass_issued',
          'exit_clearance_invalidated',
          'exit_completed',
          'session_exited',
          'discrepancy_resolved',
        ].includes(e.type),
      )
      .slice(0, 10)
  }, [allEvents])

  // Turnstile simulated hardware status
  const isTurnstileUnlocked = exitState === 'COMPLETED'
  const isTurnstileReadyToScan = exitState === 'VERIFIED'
  const isTurnstileBlocked = exitState === 'BLOCKED'

  // Corrective action handler
  const handleOperatorAction = (
    action: 'operator_verify' | 'confirm_return' | 'scan_item' | 'dismiss_uncertain',
    sku: string,
  ) => {
    const res = resolveDiscrepancy({
      action,
      sku,
      note: operatorNote || 'Operator resolution from Exit Verification Console',
    })
    setOperatorNote('')
    setFeedbackToast(res.message)
    setTimeout(() => setFeedbackToast(null), 3500)
  }

  // Simulate turnstile optical scanner reading the pass
  const handleSimulateTurnstileScan = () => {
    if (!exitPass || isSessionCompleted) return
    setIsSimulatingGateScan(true)
    setTimeout(() => {
      setIsSimulatingGateScan(false)
      completeExitJourney()
      setFeedbackToast('Turnstile optical reader verified pass! Gate unlatched and released.')
      setTimeout(() => setFeedbackToast(null), 4000)
    }, 700)
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Exit Verification & Gate Monitor"
        subtitle="Lane 1 self-checkout gate with real-time pass clearance and discrepancy override."
      >
        <div className="flex items-center gap-2">
          <Link
            to="/shop/checkout"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open Customer View</span>
          </Link>
          <button
            onClick={resetInteractiveSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Session</span>
          </button>
        </div>
      </PageHeader>

      {/* Feedback Toast */}
      {feedbackToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedbackToast}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Key Gate Metric Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Turnstile Gate State */}
        <div
          className={cn(
            'p-4 rounded-2xl border-2 transition-all shadow-xs',
            isTurnstileUnlocked
              ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950'
              : isTurnstileBlocked
                ? 'bg-amber-50/70 border-amber-400 text-amber-950'
                : isTurnstileReadyToScan
                  ? 'bg-blue-50/70 border-blue-400 text-blue-950'
                  : 'bg-white border-slate-200 text-slate-900',
          )}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Turnstile Hardware State
            </span>
            {isTurnstileUnlocked ? (
              <Unlock className="w-5 h-5 text-emerald-600" />
            ) : (
              <Lock className={cn('w-5 h-5', isTurnstileBlocked ? 'text-amber-600' : 'text-slate-400')} />
            )}
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono">
              {isTurnstileUnlocked ? 'RELEASED (Open)' : isTurnstileReadyToScan ? 'SCAN READY' : 'LOCKED (Hold)'}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {isTurnstileUnlocked
                ? 'Customer cleared and passed through'
                : isTurnstileBlocked
                  ? 'Gate held: Unresolved cart discrepancies'
                  : isTurnstileReadyToScan
                    ? 'Awaiting pass optical presentation'
                    : 'Awaiting customer exit verification request'}
            </p>
          </div>
        </div>

        {/* Exit State Machine Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Exit Verification State
            </span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                exitState === 'COMPLETED'
                  ? 'bg-slate-100 text-slate-700'
                  : exitState === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : exitState === 'READY'
                      ? 'bg-blue-100 text-blue-800'
                      : exitState === 'BLOCKED'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-slate-100 text-slate-600',
              )}
            >
              {exitState}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {exitState === 'NOT_REQUESTED' && 'Not Requested'}
              {exitState === 'BLOCKED' && 'Blocked (Hold)'}
              {exitState === 'READY' && 'Ready to Issue'}
              {exitState === 'VERIFIED' && 'Verified (Pass Issued)'}
              {exitState === 'COMPLETED' && 'Trip Completed'}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Cart: <span className="font-semibold text-slate-800">{activeCartLabel}</span> ({activeSessionId})
            </p>
          </div>
        </div>

        {/* Reconciliation Status */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Engine Reconciliation
            </span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                reconciliationStatus === 'MATCH'
                  ? 'bg-emerald-100 text-emerald-800'
                  : reconciliationStatus === 'MISMATCH'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800',
              )}
            >
              {reconciliationStatus}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {digitalItemCount} Scan / {physicalItemCount} Pick
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Discrepancies: <span className="font-bold text-slate-800">{discrepancies.length}</span> active
            </p>
          </div>
        </div>

        {/* Digital Total */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Session Value
            </span>
            <span className="text-[10px] font-mono text-slate-400">Greenfield Market</span>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold font-mono text-emerald-700">
              {formatCurrency(digitalTotal)}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {exitPass ? `Paid via ${exitPass.paymentMethod}` : 'Simulated Self-Checkout'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Active Gate Cart & Controls ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Discrepancies & Cart Reconciler */}
        <div className="lg:col-span-2 space-y-6">
          {/* Turnstile Gate Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    isTurnstileUnlocked
                      ? 'bg-emerald-500 animate-pulse'
                      : isTurnstileBlocked
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-emerald-500',
                  )}
                />
                <h3 className="font-bold text-slate-900 text-sm">
                  Lane 1 Exit Turnstile · Active Approach
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500">
                Target: {activeCartLabel}
              </span>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {/* Hold Alert Banner if Blocked */}
                {exitState === 'BLOCKED' && (
                  <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          Exit Clearance Blocked · Operator Attention Required
                        </h4>
                        <p className="text-amber-800 mt-1 leading-relaxed">
                          Reconciliation detected {discrepancies.length} discrepancy item(s). Lane 1 turnstile is locked. Customer cannot receive an exit pass until resolved.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cleared Banner if Verified */}
                {exitState === 'VERIFIED' && exitPass && (
                  <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-xs text-emerald-950 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          Pass Issued · Ready for Turnstile Optical Scan
                        </h4>
                        <p className="text-emerald-800 mt-1 leading-relaxed">
                          Digital Exit Pass #{exitPass.passId} is valid. Hold code against turnstile optical reader to complete simulated passage.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={handleSimulateTurnstileScan}
                        disabled={isSimulatingGateScan}
                        className="py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{isSimulatingGateScan ? 'Reading Pass…' : 'Simulate Turnstile Optical Scan'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Discrepancies Table / Evidence Review */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Discrepancies & Uncertain Observations ({discrepancies.length})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Shared reconciliation engine state
                    </span>
                  </div>

                  {discrepancies.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                      <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-800">
                        Zero Discrepancies in Active Session
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Digital cart items and physical shelf observations match with 100% confidence.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {discrepancies.map((d) => {
                        const isSelected = selectedSku === d.sku
                        return (
                          <div
                            key={d.sku}
                            onClick={() => setSelectedSku((prev) => (prev === d.sku ? null : d.sku))}
                            className={cn(
                              'p-3.5 rounded-xl border text-xs transition-all space-y-3 cursor-pointer',
                              isSelected
                                ? 'bg-amber-50/40 border-amber-400 ring-1 ring-amber-400'
                                : 'bg-white border-slate-200 hover:border-slate-300',
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-slate-900 text-sm">
                                  {d.productName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block">
                                  SKU: {d.sku} · Code: {d.code}
                                </span>
                              </div>
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase',
                                  d.code === 'LOW_CONFIDENCE'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800',
                                )}
                              >
                                {d.code}
                              </span>
                            </div>

                            {/* Telemetry Comparison Grid */}
                            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase">Digital Scans</span>
                                <span className="font-bold text-slate-900">{d.digitalQty}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase">Physical Confirmed</span>
                                <span className="font-bold text-slate-900">{d.physicalQty}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase">Uncertain Obs</span>
                                <span className="font-bold text-amber-700">{d.uncertainQty || 0}</span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-600 leading-relaxed">{d.description}</p>

                            {/* Operator Corrective Actions */}
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                              {d.code === 'LOW_CONFIDENCE' ? (
                                <button
                                  onClick={() => handleOperatorAction('dismiss_uncertain', d.sku)}
                                  className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] shadow-2xs flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Dismiss False Positive</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleOperatorAction('operator_verify', d.sku)}
                                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-2xs flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Visual Cart Inspection Clearance</span>
                                  </button>

                                  {d.digitalQty < d.physicalQty && (
                                    <button
                                      onClick={() => handleOperatorAction('scan_item', d.sku)}
                                      className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] shadow-2xs flex items-center gap-1"
                                    >
                                      <Barcode className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Scan Item to Cart</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleOperatorAction('confirm_return', d.sku)}
                                    className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] shadow-2xs flex items-center gap-1"
                                  >
                                    <span>Confirm Returned to Shelf</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Cross-Links */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Link
              to="/cart-twin"
              className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs flex items-center justify-between font-semibold text-slate-700 group"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Open Cart Twin Inspector</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/timeline"
              className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs flex items-center justify-between font-semibold text-slate-700 group"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>View Full Audit Timeline</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Column (1 Col): Pass Inspector & Gate Event Stream */}
        <div className="space-y-6">
          {/* Simulated Pass Inspector */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Exit Pass Inspector</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Prototype</span>
              </div>
            </CardHeader>
            <CardBody>
              {exitPass ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                      Simulated Exit Pass
                    </span>
                    <p className="font-mono font-bold text-slate-900 text-sm">{exitPass.passId}</p>
                    <p className="text-[11px] font-mono text-slate-500">{exitPass.exitCode}</p>
                  </div>

                  <div className="space-y-1.5 text-slate-600 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span>Cart:</span>
                      <span className="font-bold text-slate-900">{exitPass.cartLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issued At:</span>
                      <span className="text-slate-900">{new Date(exitPass.issuedAt).toLocaleTimeString()}</span>
                    </div>
                    {exitPass.completedAt && (
                      <div className="flex justify-between">
                        <span>Completed At:</span>
                        <span className="text-emerald-700 font-bold">
                          {new Date(exitPass.completedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Total Reconciled:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(exitPass.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="text-slate-900">{exitPass.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg text-[10px] font-mono text-slate-500 break-all border border-slate-100">
                    Checksum: {exitPass.auditChecksum}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center space-y-2 text-xs text-slate-400">
                  <QrCode className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-medium text-slate-600">No Pass Issued Yet</p>
                  <p className="text-[11px] text-slate-400">
                    Pass will appear once the customer requests verification and completes checkout review.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Turnstile Event Stream */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Gate Clearance Audit Stream</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Live</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 text-xs max-h-72 overflow-y-auto">
                {exitAuditEvents.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No exit events recorded yet.</p>
                ) : (
                  exitAuditEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1 font-mono text-[11px]"
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className={cn(
                            'font-bold uppercase text-[9px] px-1.5 py-0.5 rounded',
                            evt.severity === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : evt.severity === 'warning'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700',
                          )}
                        >
                          {evt.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(evt.occurredAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-700 font-sans text-xs leading-tight">
                        {evt.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
