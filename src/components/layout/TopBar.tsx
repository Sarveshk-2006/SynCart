/**
 * TopBar — application-wide header with store context,
 * demo indicator, search, notifications, and operator menu.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Bell, ChevronDown, Menu, X, Store, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopBarProps {
  onMenuToggle: () => void
  isSidebarOpen: boolean
}

export function TopBar({ onMenuToggle, isSidebarOpen }: TopBarProps) {
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [showSearchHint, setShowSearchHint] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const handleSearchFocus = () => {
    setSearchFocused(true)
    setShowSearchHint(true)
  }

  const handleSearchBlur = () => {
    setSearchFocused(false)
    // Keep hint visible for a moment
    setTimeout(() => setShowSearchHint(false), 150)
  }

  return (
    <header
      className="sticky top-0 z-20 h-14 bg-white/95 backdrop-blur-sm border-b border-slate-200 flex items-center px-4 gap-3"
      aria-label="Application header"
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-expanded={isSidebarOpen}
        aria-controls="sidebar"
        aria-label="Toggle navigation menu"
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Store selector / context */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 cursor-default select-none">
          <Store className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="text-xs font-medium text-slate-700 hidden sm:inline">SYNCART Demo Store</span>
          <ChevronDown className="w-3 h-3 text-slate-400" aria-hidden="true" />
        </div>
      </div>

      {/* Demo environment badge */}
      <span
        className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold tracking-wider uppercase"
        role="status"
        aria-label="Demo environment — not a live production system"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
        Demo Environment
      </span>

      {/* Customer Scan & Go Experience Link */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-colors shadow-2xs"
        title="Open Customer Scan & Go mobile shopping experience"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
        <span>Customer App</span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden sm:block">
        <label htmlFor="global-search" className="sr-only">
          Search sessions, SKUs, or carts
        </label>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200',
            searchFocused
              ? 'border-emerald-400 bg-white shadow-sm w-56'
              : 'border-slate-200 bg-slate-50 w-44',
          )}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            id="global-search"
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholder="Search…"
            className="flex-1 text-xs bg-transparent border-none outline-none placeholder-slate-400 text-slate-700"
            aria-label="Search sessions, SKUs, or carts"
            autoComplete="off"
          />
        </div>

        {/* Search hint */}
        {showSearchHint && searchValue.length === 0 && (
          <div
            className="absolute top-full left-0 mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-[var(--shadow-popover)] p-2.5 z-50 text-xs"
            role="status"
          >
            <p className="font-semibold text-slate-700">Store Search</p>
            <p className="text-slate-400 mt-0.5">
              Type a cart ID (e.g. #A7F3) or SKU to highlight items.
            </p>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          id="notifications-button"
          onClick={() => setNotifOpen((v) => !v)}
          className={cn(
            'relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors',
            notifOpen && 'bg-slate-100 text-slate-700',
          )}
          aria-label="Notifications — 2 unread"
          aria-haspopup="true"
          aria-expanded={notifOpen}
        >
          <Bell className="w-4.5 h-4.5" />
          {/* Unread indicator */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"
            aria-hidden="true"
          />
        </button>

        {notifOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setNotifOpen(false)}
              aria-hidden="true"
            />
            <div
              className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-[var(--shadow-popover)] z-50 overflow-hidden"
              role="dialog"
              aria-label="Notifications panel"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">Operator Alerts</p>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">2 unread</span>
              </div>
              <ul className="divide-y divide-slate-100" aria-label="Notification list">
                {DEMO_NOTIFICATIONS.map((n) => (
                  <li key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                          n.unread ? 'bg-emerald-500' : 'bg-slate-300',
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700">{n.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-slate-300 mt-1 font-mono">{n.time}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                <p className="text-[11px] text-slate-400 text-center">
                  Live session alerts streamed automatically
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Operator profile */}
      <button
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group"
        aria-label="Operator profile — Demo Operator"
        id="operator-profile-button"
      >
        <div
          className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <span className="text-[11px] font-bold text-white">DO</span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-medium text-slate-700 leading-tight">Demo Operator</p>
          <p className="text-[10px] text-slate-400 leading-tight">Admin</p>
        </div>
        <ChevronDown className="w-3 h-3 text-slate-400 hidden md:block" aria-hidden="true" />
      </button>
    </header>
  )
}

// ── Demo notification data ────────────────────────────────────────────────

const DEMO_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Verification Required — Cart #A7F3',
    body: 'Quantity discrepancy detected for PROD-00387. Review pending.',
    time: '2 min ago',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'Cart #B2D9 — Unscanned Item Flagged',
    body: 'Cereal box detected without scan. Confidence: Medium.',
    time: '8 min ago',
    unread: true,
  },
  {
    id: 'notif-3',
    title: 'Cart #C1E6 — Reconciliation Complete',
    body: 'All 5 items matched. Session cleared for exit.',
    time: '18 min ago',
    unread: false,
  },
]
