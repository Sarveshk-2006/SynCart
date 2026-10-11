/**
 * CustomerCartPage — Digital Cart management for customer experience.
 *
 * Line items, quantity increments/decrements, item removal,
 * reconciliation status badge, subtotal, tax, total, and checkout navigation.
 */
import { Link } from 'react-router-dom'
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  AlertTriangle,
  ScanLine,
} from 'lucide-react'
import { useCustomerCart } from '@/context/CustomerCartContext'
import { formatCurrency } from '@/lib/utils'

export function CustomerCartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    subtotal,
    tax,
    total,
    reconciliationState,
    triggerDemoMismatch,
  } = useCustomerCart()

  if (items.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Scan grocery items from the shelves or browse the catalogue to add products to your digital cart.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Link
            to="/shop/scan"
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <ScanLine className="w-4 h-4" />
            <span>Open Barcode Scanner</span>
          </Link>
          <Link
            to="/shop"
            className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
          >
            Browse Catalogue
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* ── Cart Header & Status ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Digital Cart</h1>
          <p className="text-xs text-slate-500">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* ── Reconciliation Status Component (Requirement #8 & #9) ── */}
      {reconciliationState === 'mismatch_review' ? (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900">Let&apos;s double-check this item.</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              We couldn&apos;t confirm a match between your scanned product and the observed pickup. Review the item before continuing.
            </p>
            <button
              onClick={() => triggerDemoMismatch()}
              className="mt-2 text-xs font-bold text-amber-800 underline hover:text-amber-950"
            >
              Open Review Prompt
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Digital cart matches physical shelf sensors</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100/80 px-2 py-0.5 rounded-full">
            In Sync
          </span>
        </div>
      )}

      {/* ── Cart Line Items List ──────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
        {items.map((item) => (
          <div
            key={item.product.sku}
            className="p-4 flex items-center gap-3.5 hover:bg-slate-50/50 transition-colors"
          >
            {/* Thumbnail */}
            <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 select-none">
              {item.product.imageEmoji}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-slate-900 truncate">
                {item.product.name}
              </h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                {item.product.sku} · {formatCurrency(item.product.priceUsd)} each
              </p>
              <p className="text-xs font-bold text-slate-900 mt-1 font-mono">
                {formatCurrency(item.product.priceUsd * item.quantity)}
              </p>
            </div>

            {/* Quantity Stepper & Trash */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => removeItem(item.product.sku)}
                className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                aria-label={`Remove ${item.product.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => updateQuantity(item.product.sku, item.quantity - 1)}
                  className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-2xs transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-900 font-mono">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.product.sku, item.quantity + 1)}
                  className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-2xs transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Order Summary Card ────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Payment Breakdown
        </span>

        <div className="flex justify-between text-xs text-slate-600">
          <span>Subtotal ({itemCount} items)</span>
          <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between text-xs text-slate-600">
          <span>Estimated Grocery Tax (5%)</span>
          <span className="font-mono font-medium">{formatCurrency(tax)}</span>
        </div>

        <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
          <span>Estimated Total</span>
          <span className="font-mono text-emerald-700">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* ── Actions: Continue Shopping vs Proceed to Checkout ─────── */}
      <div className="space-y-2 pt-2">
        <Link
          to="/shop/checkout"
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <span>Proceed to Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/shop/scan"
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <ScanLine className="w-3.5 h-3.5 text-emerald-600" />
            <span>Scan More Items</span>
          </Link>
          <Link
            to="/shop"
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>Browse Aisle</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
