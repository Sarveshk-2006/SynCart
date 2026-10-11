/**
 * ShopEntryPage — Store entry and grocery catalogue.
 *
 * Welcoming demo store entry, search, category filters,
 * refined grocery product cards, and instant add-to-cart actions.
 */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  ScanLine,
  Plus,
  Check,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react'
import { PRODUCTS } from '@/data/demo'
import { useCustomerCart } from '@/context/CustomerCartContext'
import { formatCurrency, cn } from '@/lib/utils'
import type { Product } from '@/types/domain'

const CATEGORIES = [
  'All',
  'Produce',
  'Dairy & Eggs',
  'Bakery',
  'Beverages',
  'Breakfast',
  'Pantry',
  'Meat',
  'Seafood',
  'Snacks',
  'Deli',
]

const ALL_PRODUCTS_LIST: Product[] = Object.values(PRODUCTS)

export function ShopEntryPage() {
  const { addItem, cartLabel, storeName, triggerDemoMismatch } = useCustomerCart()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [addedSku, setAddedSku] = useState<string | null>(null)
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null)

  // Filter products
  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS_LIST.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        p.category.toLowerCase().includes(selectedCategory.toLowerCase())
      const matchesSearch =
        search.trim() === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, search])

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    addItem(product, 1)
    setAddedSku(product.sku)
    setTimeout(() => setAddedSku(null), 1500)
  }

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* ── Welcome & Shopping Session Banner ─────────────────────── */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
            Demo Store Entry
          </span>
          <span className="text-xs font-mono font-medium text-emerald-100">
            {cartLabel}
          </span>
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight">Welcome to {storeName}</h1>
          <p className="text-xs text-emerald-100 mt-0.5 leading-relaxed">
            Scan items as you put them in your cart. Reconciles automatically before you leave.
          </p>
        </div>

        {/* 3 Quick Step Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/15 text-[11px] text-white">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <span>Scan barcode</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <span>Bag in cart</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <span>Fast exit pass</span>
          </div>
        </div>
      </div>

      {/* ── Prominent Scanner Shortcut Card ───────────────────────── */}
      <Link
        to="/shop/scan"
        className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs hover:border-emerald-300 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Barcode Scanner</p>
            <p className="text-[11px] text-slate-500">
              Scan items or test simulated barcode detection
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
      </Link>

      {/* ── Search Bar ────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organic milk, eggs, bakery, produce…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
        />
      </div>

      {/* ── Category Chips ────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none text-xs">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors shadow-2xs',
                isSelected
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100',
              )}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* ── Catalogue Product Grid ────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Available Groceries ({filteredProducts.length})</span>
          <span>Tap item for info or + to add</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => {
            const isJustAdded = addedSku === product.sku
            return (
              <div
                key={product.sku}
                onClick={() => setInspectedProduct(product)}
                className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail & Emoji */}
                  <div className="w-full h-24 rounded-xl bg-slate-50 flex items-center justify-center text-4xl mb-2.5 border border-slate-100 group-hover:scale-102 transition-transform">
                    {product.imageEmoji}
                  </div>

                  {/* Category tag */}
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                    {product.category}
                  </span>

                  {/* Name & SKU */}
                  <h3 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {product.sku}
                  </p>
                </div>

                {/* Price & Add button */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {formatCurrency(product.priceUsd)}
                  </span>

                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    className={cn(
                      'p-2 rounded-xl transition-all shadow-2xs flex items-center justify-center',
                      isJustAdded
                        ? 'bg-emerald-600 text-white scale-105'
                        : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white',
                    )}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    {isJustAdded ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Demo Helper Bar (Evaluator Conveniences) ───────────────── */}
      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold text-slate-900">Demo Scenario Helper</p>
            <p className="text-[11px] text-slate-600">
              Test customer-facing illustrative mismatch notification
            </p>
          </div>
        </div>
        <button
          onClick={() => triggerDemoMismatch()}
          className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-2xs whitespace-nowrap"
        >
          Test Mismatch
        </button>
      </div>

      {/* ── Product Detail Modal ──────────────────────────────────── */}
      {inspectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {inspectedProduct.category}
              </span>
              <button
                onClick={() => setInspectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-5xl border border-slate-100">
                {inspectedProduct.imageEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  {inspectedProduct.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  SKU: {inspectedProduct.sku}
                </p>
                <p className="text-lg font-bold text-emerald-700 mt-1 font-mono">
                  {formatCurrency(inspectedProduct.priceUsd)}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <p><strong>Demo Stock:</strong> 10+ units on shelf</p>
              <p><strong>Store Lane:</strong> Greenfield Market Main Floor</p>
              <p><strong>Physical Sensor:</strong> Optical + Weight Shelf Calibration</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  addItem(inspectedProduct, 1)
                  setInspectedProduct(null)
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Cart ({formatCurrency(inspectedProduct.priceUsd)})</span>
              </button>

              <Link
                to="/shop/scan"
                className="py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <ScanLine className="w-4 h-4 text-emerald-600" />
                <span>Simulate Scan</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
