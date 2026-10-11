/**
 * Sidebar navigation for SYNCART application shell.
 *
 * Responsive: full sidebar on desktop, collapsible on tablet,
 * bottom-nav-style on mobile (handled via CSS).
 */
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  GitCompare,
  Clock,
  ShieldCheck,
  Eye,
  LogOut,
  Settings,
  X,
  Activity,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  icon: typeof LayoutDashboard
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',            to: '/overview',          icon: LayoutDashboard },
  { label: 'Live Sessions',       to: '/sessions',          icon: Activity },
  { label: 'Cart Twin',           to: '/cart-twin',         icon: GitCompare },
  { label: 'Event Timeline',      to: '/timeline',          icon: Clock },
  { label: 'Verification Queue',  to: '/verification',      icon: ShieldCheck },
  { label: 'Vision Simulator',    to: '/vision',            icon: Eye },
  { label: 'Exit Verification',   to: '/exit-verification', icon: LogOut },
]

const SECONDARY_ITEMS: NavItem[] = [
  { label: 'Customer App',        to: '/shop',              icon: Smartphone },
  { label: 'Settings',            to: '/settings',          icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()

  const handleLogoClick = () => {
    navigate('/overview')
    onClose()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        id="sidebar"
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-60 bg-white border-r border-slate-200/90',
          'flex flex-col transition-transform duration-200 ease-out',
          'lg:translate-x-0 lg:static lg:z-auto lg:h-screen',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Primary navigation"
      >
        {/* ── Brand ──────────────────────────────── */}
        <div className="px-4 h-14 flex items-center justify-between border-b border-slate-100 shrink-0">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 focus-visible:outline-emerald-500 rounded-lg p-1 -m-1 transition-colors hover:bg-slate-50"
            aria-label="SYNCART — go to Overview"
          >
            <SyncartLogo />
            <div className="text-left">
              <span className="text-sm font-bold text-slate-900 tracking-tight block">SYNCART</span>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">RECONCILIATION</p>
            </div>
          </button>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Primary nav ────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 flex flex-col gap-0.5" aria-label="Main menu">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onClose} />
          ))}
        </nav>

        {/* ── Secondary nav ──────────────────────── */}
        <div className="px-2.5 py-3 border-t border-slate-100 flex flex-col gap-0.5">
          {SECONDARY_ITEMS.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onClose} />
          ))}

          {/* Operator identity */}
          <div className="mt-2 px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
              <ShoppingCart className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight">Demo Operator</p>
              <p className="text-[10px] text-slate-400 truncate font-mono">Terminal 01</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      aria-label={item.label}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150',
          isActive
            ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-2xs'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'w-4 h-4 shrink-0 transition-colors',
              isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600',
            )}
            aria-hidden="true"
          />
          <span className="flex-1 truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function SyncartLogo() {
  return (
    <div
      className="w-8 h-8 rounded-[8px] bg-emerald-500 flex items-center justify-center shrink-0"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        {/* Cart */}
        <path
          d="M4 6h2l2 8h8l2-6H9"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="16.5" r="1" fill="white" />
        <circle cx="15" cy="16.5" r="1" fill="white" />
        {/* Check */}
        <path
          d="M13 10.5l1.5 1.5 2.5-2.5"
          stroke="#a7f3d0"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
