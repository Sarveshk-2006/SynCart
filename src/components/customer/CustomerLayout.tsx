/**
 * CustomerLayout — Mobile-first shell for Phase 2 Scan & Go customer shopping experience.
 *
 * Provides customer header with store context, session pill, quick link to Operator Console,
 * friendly mismatch dialog prompt, and fixed bottom navigation bar.
 */
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import {
  ShoppingBag,
  ScanLine,
  ShoppingCart,
  Receipt,
  Store,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  LayoutDashboard,
} from 'lucide-react'
import { useCustomerCart } from '@/context/CustomerCartContext'
import { cn } from '@/lib/utils'

export function CustomerLayout() {
  const {
    cartLabel,
    storeName,
    itemCount,
    reconciliationState,
    activeDiscrepancy,
    resolveMismatch,
    dismissMismatchPrompt,
  } = useCustomerCart()

  const location = useLocation()
  const isCheckout = location.pathname.includes('/checkout')

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans antialiased">
      {/* ── Top Bar: Store context & Operator Switcher ──────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* Brand & Store */}
          <Link to="/shop" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 tracking-tight">SYNCART</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                  Scan & Go
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                <Store className="w-3 h-3 text-slate-400" />
                <span>{storeName}</span>
                <span className="text-slate-300">·</span>
                <span className="font-mono font-medium text-slate-600">{cartLabel}</span>
              </p>
            </div>
          </Link>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Reconciliation Pill */}
            {reconciliationState === 'mismatch_review' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold animate-pulse">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span className="hidden xs:inline">Needs</span> Review
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span className="hidden xs:inline">Reconciled</span>
              </span>
            )}

            {/* Back to Operator Console Link */}
            <Link
              to="/overview"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
              title="Switch to Store Operations Console"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Operator</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mismatch Modal Dialog (Requirement #9) ────────────────── */}
      {activeDiscrepancy && !isCheckout && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {activeDiscrepancy.message}
                  </h3>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                    Reconciliation Notice
                  </p>
                </div>
              </div>
              <button
                onClick={dismissMismatchPrompt}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product card in notice */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-3xl shrink-0 select-none">{activeDiscrepancy.product.imageEmoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {activeDiscrepancy.product.name}
                </p>
                <p className="text-[11px] font-mono text-slate-400">
                  {activeDiscrepancy.product.sku} · ${activeDiscrepancy.product.priceUsd.toFixed(2)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {activeDiscrepancy.guidance}
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => resolveMismatch('confirm_item')}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm item in cart</span>
              </button>

              <button
                onClick={() => resolveMismatch('return_to_shelf')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Returned to shelf</span>
              </button>

              <button
                onClick={() => resolveMismatch('rescan')}
                className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors"
              >
                Scan barcode again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Customer Body ────────────────────────────────────── */}
      <main className="flex-1 max-w-xl w-full mx-auto pb-24 px-4 sm:px-6 pt-4">
        <Outlet />
      </main>

      {/* ── Mobile-First Fixed Bottom Navigation Bar ──────────────── */}
      {!isCheckout && (
        <nav
          aria-label="Customer navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg"
        >
          <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-around">
            {/* 1. Shop / Catalogue */}
            <NavLink
              to="/shop"
              end
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'text-emerald-600 font-bold'
                    : 'text-slate-500 hover:text-slate-900',
                )
              }
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Shop</span>
            </NavLink>

            {/* 2. Scan (Prominent Center Button) */}
            <NavLink
              to="/shop/scan"
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center -mt-5 w-13 h-13 rounded-full shadow-md transition-transform active:scale-95',
                  isActive
                    ? 'bg-emerald-700 text-white ring-4 ring-emerald-100'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 ring-4 ring-white',
                )
              }
              aria-label="Scan barcode"
            >
              <ScanLine className="w-6 h-6" />
            </NavLink>

            {/* 3. Cart with Badge */}
            <NavLink
              to="/shop/cart"
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'text-emerald-600 font-bold'
                    : 'text-slate-500 hover:text-slate-900',
                )
              }
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {itemCount}
                  </span>
                )}
              </div>
              <span>Cart</span>
            </NavLink>

            {/* 4. Checkout */}
            <NavLink
              to="/shop/checkout"
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'text-emerald-600 font-bold'
                    : 'text-slate-500 hover:text-slate-900',
                )
              }
            >
              <Receipt className="w-5 h-5" />
              <span>Checkout</span>
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  )
}
