/**
 * CustomerCheckoutPage — Phase 5 Customer Exit Verification Experience
 *
 * Implements the full deterministic exit-verification lifecycle:
 * 1. NOT_REQUESTED: Overview with session details & "Verify for Exit" button
 * 2. BLOCKED: Non-accusatory discrepancy breakdown with corrective actions & disabled pass button
 * 3. READY: 100% match confirmation with payment selection & "Confirm & Generate Exit Pass"
 * 4. VERIFIED: Simulated Digital Exit Pass card with QR code, receipt, and "Complete Trip" action
 * 5. COMPLETED: Trip archived confirmation with "Start New Shopping Trip" reset action
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  Receipt,
  CreditCard,
  ExternalLink,
  ShoppingBag,
  RefreshCw,
  HelpCircle,
  Barcode,
  Layers,
  Lock,
  Sparkles,
} from 'lucide-react'
import { useCustomerCart } from '@/context/CustomerCartContext'
import { useReconciliation } from '@/context/ReconciliationContext'
import { formatCurrency, cn } from '@/lib/utils'

export function CustomerCheckoutPage() {
  const {
    items,
    itemCount,
    subtotal,
    tax,
    total,
    cartLabel,
    sessionId,
    storeName,
    startNewTrip,
    exitState,
    exitPass,
    requestExitVerification,
    confirmAndIssueExitPass,
    completeExitJourney,
  } = useCustomerCart()

  const {
    discrepancies,
    physicalItemCount,
    resolveDiscrepancy,
  } = useReconciliation()

  const [paymentMethod, setPaymentMethod] = useState('Apple Pay (Demo)')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isIssuingPass, setIsIssuingPass] = useState(false)
  const [activeTab, setActiveTab] = useState<'pass' | 'receipt'>('pass')

  // ── Handler: Verify for Exit ──────────────────────────────────────
  const handleVerifyForExit = () => {
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      requestExitVerification()
    }, 400)
  }

  // ── Handler: Issue Pass (Double click protected) ──────────────────
  const handleGeneratePass = () => {
    if (isIssuingPass) return
    setIsIssuingPass(true)
    setTimeout(() => {
      setIsIssuingPass(false)
      confirmAndIssueExitPass(paymentMethod)
    }, 600)
  }

  // ── Handler: Quick inline scan correction for blocked item ────────
  const handleQuickScan = (sku: string) => {
    resolveDiscrepancy({ action: 'scan_item', sku })
  }

  // ── 5. COMPLETED STATE ────────────────────────────────────────────
  if (exitState === 'COMPLETED') {
    return (
      <div className="py-2 space-y-5 animate-in fade-in max-w-md mx-auto">
        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wide uppercase">
            Trip Completed · Gate Released
          </span>
          <h1 className="text-xl font-bold text-slate-900">Thank You for Visiting!</h1>
          <p className="text-xs text-slate-500">
            Your shopping trip at {storeName} is complete. Turnstile gate unlocked.
          </p>
        </div>

        {/* Completion Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <p className="font-bold text-slate-900">{cartLabel}</p>
              <p className="text-[10px] font-mono text-slate-400">Session ID: {sessionId}</p>
            </div>
            {exitPass && (
              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-semibold">
                {exitPass.passId}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Total Items</span>
              <span className="font-bold text-slate-900 text-sm">{exitPass?.itemCount || itemCount} items</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Total Paid</span>
              <span className="font-bold text-emerald-700 text-sm">
                {formatCurrency(exitPass?.total || total)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Reconciliation Complete:</span> 100% matched items between digital scans and physical shelf telemetry.
            </div>
          </div>

          {exitPass?.auditChecksum && (
            <div className="text-[10px] font-mono text-slate-400 text-center truncate">
              Audit Checksum: {exitPass.auditChecksum}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={startNewTrip}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Start a New Shopping Trip</span>
          </button>

          <Link
            to="/exit-verification"
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>View Operator Gate Log</span>
          </Link>
        </div>
      </div>
    )
  }

  // ── 4. VERIFIED STATE (Pass Issued) ───────────────────────────────
  if (exitState === 'VERIFIED' && exitPass) {
    return (
      <div className="py-2 space-y-5 animate-in fade-in max-w-md mx-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Exit Clearance Approved</h1>
          <p className="text-xs text-slate-500">
            Reconciliation 100% verified. Present this pass at Lane 1 Exit Turnstile.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
          <button
            onClick={() => setActiveTab('pass')}
            className={cn(
              'flex-1 py-1.5 font-bold rounded-lg transition-all',
              activeTab === 'pass'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800',
            )}
          >
            Digital Exit Pass
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={cn(
              'flex-1 py-1.5 font-bold rounded-lg transition-all',
              activeTab === 'receipt'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800',
            )}
          >
            Itemized Receipt
          </button>
        </div>

        {activeTab === 'pass' ? (
          /* Digital Exit Pass Card */
          <div className="bg-white rounded-3xl border-2 border-emerald-500 p-6 shadow-md text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
              <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                SIMULATED EXIT PASS — PROTOTYPE
              </span>
              <span className="font-mono text-slate-400 font-semibold">{exitPass.passId}</span>
            </div>

            {/* QR Code graphic */}
            <div className="flex flex-col items-center">
              <div className="w-44 h-44 p-3 bg-white border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-inner relative group">
                <QrCode className="w-36 h-36 text-slate-900" />
                <div className="absolute inset-x-2 bottom-2 bg-slate-900 text-white text-[9px] font-mono py-0.5 rounded text-center opacity-90">
                  {exitPass.cartLabel}
                </div>
              </div>
              <p className="text-[12px] font-mono font-bold text-slate-800 mt-2.5 tracking-wider">
                {exitPass.exitCode}
              </p>
            </div>

            {/* Store & Verification Metadata */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-left space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Store:</span>
                <span className="font-bold text-slate-800">{exitPass.storeName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cart / Session:</span>
                <span className="text-slate-800">{exitPass.cartLabel} ({exitPass.sessionId})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Issued At:</span>
                <span className="text-slate-800">{new Date(exitPass.issuedAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Items Cleared:</span>
                <span className="text-emerald-700 font-bold">{exitPass.itemCount} items (100% Match)</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span>Total Paid:</span>
                <span className="font-bold text-slate-900">{formatCurrency(exitPass.total)}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed text-left flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Scan at Lane 1 Exit Turnstile:</strong> Present this code to the optical reader at the exit gate to unlock turnstile.
              </div>
            </div>
          </div>
        ) : (
          /* Itemized Receipt */
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Purchase & Audit Manifest</span>
            </div>

            <ul className="divide-y divide-slate-100 text-xs">
              {exitPass.items.map((item) => (
                <li key={item.product.sku} className="py-2 flex justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.product.imageEmoji}</span>
                    <div>
                      <span className="font-medium text-slate-800">{item.product.name}</span>
                      <span className="text-slate-400 block text-[10px] font-mono">
                        ×{item.quantity} @ {formatCurrency(item.product.priceUsd)}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-medium text-slate-900">
                    {formatCurrency(item.product.priceUsd * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-2 border-t border-slate-100 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(exitPass.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax (5%):</span>
                <span>{formatCurrency(exitPass.tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
                <span>Total Paid:</span>
                <span className="text-emerald-700">{formatCurrency(exitPass.total)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center font-mono">
              Paid via {exitPass.paymentMethod} · Checksum: {exitPass.auditChecksum.slice(0, 16)}…
            </div>
          </div>
        )}

        {/* Completion Action */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => completeExitJourney()}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Trip & Release Gate</span>
          </button>

          <div className="flex gap-2">
            <Link
              to="/exit-verification"
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Operator Gate Monitor</span>
            </Link>
            <Link
              to="/cart-twin"
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Cart Twin</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── 1, 2, 3. PRE-EXIT REVIEW (NOT_REQUESTED, BLOCKED, READY) ───────
  const isBlocked = exitState === 'BLOCKED'
  const isReady = exitState === 'READY'
  const isNotRequested = exitState === 'NOT_REQUESTED'

  return (
    <div className="space-y-5 animate-in fade-in max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/shop/cart"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-mono font-medium text-slate-500">{cartLabel}</span>
        </div>
      </div>

      <div>
        <h1 className="text-lg font-bold text-slate-900">Exit Verification</h1>
        <p className="text-xs text-slate-500">
          Scans and shelf observations are verified before issuing an exit pass.
        </p>
      </div>

      {/* ── Status Banner ─────────────────────────────────────────── */}
      {isBlocked ? (
        /* BLOCKED STATE BANNER */
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-900 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Item Review Required
                </h3>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-full uppercase">
                  Verification Blocked
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Difference detected between scans and shelf observations. Please review below.
              </p>
            </div>
          </div>

          {/* List of Blocking Discrepancies */}
          <div className="space-y-2 pt-1 border-t border-amber-200">
            <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider block">
              Items Requiring Review ({discrepancies.length}):
            </span>
            {discrepancies.map((disc) => (
              <div
                key={disc.sku}
                className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-1.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-900">{disc.productName}</span>
                    <span className="text-[10px] font-mono text-slate-400 block">SKU: {disc.sku}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                    {disc.code === 'PICK_NOT_SCANNED'
                      ? 'Unscanned Item'
                      : disc.code === 'LOW_CONFIDENCE'
                        ? 'Low Confidence Telemetry'
                        : 'Quantity Difference'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 flex justify-between bg-slate-50 p-1.5 rounded-lg font-mono">
                  <span>Scanned: {disc.digitalQty}</span>
                  <span>Physical Detected: {disc.code === 'LOW_CONFIDENCE' ? `~${disc.uncertainQty} (Uncertain)` : disc.physicalQty}</span>
                </div>

                <p className="text-[11px] text-amber-900">{disc.guidance}</p>

                {/* Inline Action */}
                {disc.digitalQty < disc.physicalQty && disc.code !== 'LOW_CONFIDENCE' && (
                  <button
                    onClick={() => handleQuickScan(disc.sku)}
                    className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Barcode className="w-3.5 h-3.5" />
                    <span>Scan {disc.productName} Now</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Assistance & Operator Link */}
          <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-[11px]">
            <Link
              to="/shop/scan"
              className="font-bold text-amber-900 hover:underline flex items-center gap-1"
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Return to Scanner</span>
            </Link>
            <Link
              to="/verification"
              className="text-amber-800 hover:underline flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Request Operator Review</span>
            </Link>
          </div>
        </div>
      ) : isReady ? (
        /* READY STATE BANNER */
        <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-xs text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-sm">Cart Reconciliation Verified</p>
              <p className="text-[11px] text-emerald-700">
                All {itemCount} items match physical sensor telemetry. Cleared for exit pass issuance.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase shrink-0">
            100% Match
          </span>
        </div>
      ) : (
        /* NOT_REQUESTED STATE BANNER */
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              Exit Verification Step
            </span>
            <span className="text-[10px] font-mono text-slate-400">Pre-Exit Check</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Before proceeding through the exit turnstiles, SYNCART reconciles your digital cart ({itemCount} items) against shelf sensors ({physicalItemCount} items detected).
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[9px] uppercase">Digital Scans</span>
              <span className="font-bold text-slate-900">{itemCount} items</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[9px] uppercase">Shelf Observations</span>
              <span className="font-bold text-slate-900">{physicalItemCount} items</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Itemized Order Manifest ───────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex justify-between items-center text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
          <span>Digital Cart Manifest ({itemCount} items)</span>
          <Link to="/shop/cart" className="text-emerald-700 font-semibold hover:underline">
            Edit
          </Link>
        </div>

        <ul className="divide-y divide-slate-100 text-xs max-h-44 overflow-y-auto">
          {items.map((item) => (
            <li key={item.product.sku} className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl">{item.product.imageEmoji}</span>
                <div className="truncate">
                  <p className="font-medium text-slate-800 truncate">{item.product.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(item.product.priceUsd * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        {/* Calculations */}
        <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Estimated Grocery Tax</span>
            <span className="font-mono">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-100">
            <span>Total</span>
            <span className="font-mono text-emerald-700">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* ── Payment Method Selector (Enabled in READY state) ───────── */}
      {isReady && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 animate-in fade-in">
          <span className="text-xs font-bold text-slate-900 block">
            Select Simulated Payment Method
          </span>

          <div className="space-y-2">
            {[
              { id: 'Apple Pay (Demo)', label: 'Apple Pay', desc: 'Instant demo token' },
              { id: 'Google Pay (Demo)', label: 'Google Pay', desc: 'Fast digital wallet' },
              { id: 'Store Card •••• 8492', label: 'Greenfield Loyalty Card', desc: 'Balance: $120.00' },
            ].map((method) => {
              const isSelected = paymentMethod === method.id
              return (
                <label
                  key={method.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className={cn('w-4 h-4', isSelected ? 'text-emerald-600' : 'text-slate-400')} />
                    <div>
                      <p className="font-bold text-slate-900">{method.label}</p>
                      <p className="text-[10px] text-slate-400">{method.desc}</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={isSelected}
                    onChange={() => setPaymentMethod(method.id)}
                    className="accent-emerald-600"
                  />
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Primary Action Buttons ─────────────────────────────────── */}
      <div className="space-y-2 pt-2">
        {isNotRequested ? (
          /* Step 1: Verify for Exit Button */
          <button
            onClick={handleVerifyForExit}
            disabled={isVerifying || itemCount === 0}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reconciling Cart Telemetry…</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify for Exit</span>
              </>
            )}
          </button>
        ) : isBlocked ? (
          /* Step 2: Blocked State (Disabled Pass Button) */
          <div className="space-y-2">
            <button
              disabled
              className="w-full py-3.5 px-4 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed shadow-none"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Exit Verification Blocked · Resolve Review Above</span>
            </button>
            <button
              onClick={handleVerifyForExit}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Re-check Reconciliation</span>
            </button>
          </div>
        ) : (
          /* Step 3: Ready State (Confirm & Generate Pass) */
          <button
            onClick={handleGeneratePass}
            disabled={isIssuingPass || itemCount === 0}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60"
          >
            {isIssuingPass ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Digital Exit Pass…</span>
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                <span>Confirm & Generate Exit Pass · {formatCurrency(total)}</span>
              </>
            )}
          </button>
        )}

        <p className="text-[11px] text-slate-400 text-center">
          Simulated prototype exit clearance. No real payment or hardware gateway involved.
        </p>
      </div>
    </div>
  )
}
