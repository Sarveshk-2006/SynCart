/**
 * ScannerPage — Simulated customer barcode scanner.
 *
 * Implements a camera-viewfinder visual, animated scanning reticle,
 * explicit demo product barcode selector, instant scan confirmation feedback,
 * and cart integration. Labeled clearly as simulated demo prototype.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  ShoppingCart,
  AlertTriangle,
  Info,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { PRODUCTS } from '@/data/demo'
import { useCustomerCart } from '@/context/CustomerCartContext'
import { formatCurrency, cn } from '@/lib/utils'
import type { Product } from '@/types/domain'

const DEMO_PRESET_PRODUCTS: Product[] = [
  PRODUCTS.EGGS,
  PRODUCTS.MILK,
  PRODUCTS.BREAD,
  PRODUCTS.CEREAL,
  PRODUCTS.WATER,
  PRODUCTS.APPLES,
  PRODUCTS.CHEESE,
  PRODUCTS.TOMATOES,
]

export function ScannerPage() {
  const { simulateScan, itemCount, subtotal } = useCustomerCart()

  const [selectedProduct, setSelectedProduct] = useState<Product>(DEMO_PRESET_PRODUCTS[0])
  const [isScanning, setIsScanning] = useState(false)
  const [scannedResult, setScannedResult] = useState<{
    product: Product
    timestamp: string
    isMismatch: boolean
  } | null>(null)

  const handleExecuteScan = (forceMismatch = false) => {
    setIsScanning(true)
    setScannedResult(null)

    setTimeout(() => {
      setIsScanning(false)
      const res = simulateScan(selectedProduct, forceMismatch)
      setScannedResult({
        product: selectedProduct,
        timestamp: new Date().toLocaleTimeString(),
        isMismatch: res.isMismatch,
      })
    }, 600)
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* ── Scanner Note ─────────────────────────────────────────── */}
      <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200 text-xs text-sky-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>Simulated Barcode Scanner · Select preset item below</span>
        </div>
        <span className="text-[10px] font-mono text-sky-700 font-semibold hidden sm:inline">DEMO RETICLE</span>
      </div>

      {/* ── Camera Viewfinder Frame ───────────────────────────────── */}
      <div className="relative w-full aspect-4/3 max-h-[300px] rounded-3xl bg-slate-900 overflow-hidden shadow-md border-2 border-slate-800 flex flex-col items-center justify-center p-4">
        {/* Background grid simulation */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        {/* Viewfinder Reticle Corners */}
        <div className="relative w-52 h-44 border-2 border-emerald-500/30 rounded-2xl flex flex-col items-center justify-center p-3">
          {/* Corner highlights */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />

          {/* Animated Laser Beam */}
          <div
            className={cn(
              'absolute left-2 right-2 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] transition-all duration-700',
              isScanning ? 'top-3/4 animate-pulse' : 'top-1/2',
            )}
          />

          {/* Target Product Emoji & Barcode Visual */}
          <div className="flex flex-col items-center text-center z-10">
            <span className="text-4xl filter drop-shadow-md mb-1 animate-in zoom-in-90">
              {selectedProduct.imageEmoji}
            </span>
            <p className="text-xs font-bold text-white tracking-wide truncate max-w-[170px]">
              {selectedProduct.name}
            </p>
            <p className="text-[10px] font-mono text-emerald-400 mt-0.5">
              {selectedProduct.sku}
            </p>

            {/* Stylized Simulated Barcode SVG */}
            <div className="mt-2 bg-white px-2.5 py-1 rounded-md shadow-xs">
              <svg className="h-4 w-28" viewBox="0 0 100 16">
                <rect x="0" y="0" width="3" height="16" fill="#0f172a" />
                <rect x="5" y="0" width="1" height="16" fill="#0f172a" />
                <rect x="8" y="0" width="4" height="16" fill="#0f172a" />
                <rect x="15" y="0" width="2" height="16" fill="#0f172a" />
                <rect x="20" y="0" width="3" height="16" fill="#0f172a" />
                <rect x="25" y="0" width="1" height="16" fill="#0f172a" />
                <rect x="30" y="0" width="5" height="16" fill="#0f172a" />
                <rect x="38" y="0" width="2" height="16" fill="#0f172a" />
                <rect x="44" y="0" width="3" height="16" fill="#0f172a" />
                <rect x="50" y="0" width="2" height="16" fill="#0f172a" />
                <rect x="56" y="0" width="4" height="16" fill="#0f172a" />
                <rect x="63" y="0" width="1" height="16" fill="#0f172a" />
                <rect x="68" y="0" width="3" height="16" fill="#0f172a" />
                <rect x="74" y="0" width="2" height="16" fill="#0f172a" />
                <rect x="80" y="0" width="5" height="16" fill="#0f172a" />
                <rect x="88" y="0" width="2" height="16" fill="#0f172a" />
                <rect x="94" y="0" width="4" height="16" fill="#0f172a" />
              </svg>
            </div>
          </div>
        </div>

        {/* Viewfinder instructions */}
        <p className="text-[11px] text-slate-400 mt-3 font-medium">
          {isScanning ? 'Reading barcode signature…' : 'Align barcode within frame'}
        </p>
      </div>

      {/* ── Scan Action Controls ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleExecuteScan(false)}
          disabled={isScanning}
          className={cn(
            'py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98',
            isScanning && 'opacity-70 cursor-not-allowed',
          )}
        >
          <Zap className="w-4 h-4 text-emerald-300" />
          <span>{isScanning ? 'Scanning…' : `Scan ${selectedProduct.name.split(' ')[0]}`}</span>
        </button>

        <button
          onClick={() => handleExecuteScan(true)}
          disabled={isScanning}
          className="py-3 px-4 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          title="Simulate a discrepancy for testing verification prompt"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Simulate Mismatch</span>
        </button>
      </div>

      {/* ── Scan Confirmation Feedback Box ───────────────────────── */}
      {scannedResult && !scannedResult.isMismatch && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">
                Added {scannedResult.product.name}
              </p>
              <p className="text-[11px] text-slate-500">
                Cart now has {itemCount} items · {formatCurrency(subtotal)}
              </p>
            </div>
          </div>
          <Link
            to="/shop/cart"
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 shadow-2xs"
          >
            View Cart
          </Link>
        </div>
      )}

      {/* ── Demo Product Selector Carousel ────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">Select Item to Simulate Scan</span>
          <span className="text-[10px] text-slate-400 font-mono">Tap to switch</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {DEMO_PRESET_PRODUCTS.map((product) => {
            const isSelected = selectedProduct.sku === product.sku
            return (
              <button
                key={product.sku}
                onClick={() => {
                  setSelectedProduct(product)
                  setScannedResult(null)
                }}
                className={cn(
                  'flex flex-col items-center p-2 rounded-xl border text-center transition-all',
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <span className="text-2xl mb-1">{product.imageEmoji}</span>
                <span className="text-[11px] font-bold text-slate-800 truncate w-full">
                  {product.name.split(' ')[0]}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-medium">
                  {formatCurrency(product.priceUsd)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Bottom Cart Summary Bar ───────────────────────────────── */}
      <div className="p-3 rounded-xl bg-slate-100 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-slate-500" />
          <span>Active Cart: <strong>{itemCount} items</strong> ({formatCurrency(subtotal)})</span>
        </div>
        <Link
          to="/shop/cart"
          className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
        >
          <span>Open Cart</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
