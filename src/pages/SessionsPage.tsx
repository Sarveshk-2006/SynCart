/**
 * Live Sessions page — Module B
 *
 * Full session management: list, search, filter, sort,
 * and session detail drawer.
 */
import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, Activity, CheckCircle2, ShieldAlert, LogOut } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SessionStatusBadge } from '@/components/ui/StatusBadge'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'
import { CART_TWIN_BY_SESSION } from '@/data/demo'
import { formatRelativeTime, formatCurrency, cn } from '@/lib/utils'
import type { ShoppingSession, SessionStatus } from '@/types/domain'
import { useReconciliation, ACTIVE_SESSION_ID } from '@/context/ReconciliationContext'

type SortKey = 'startedAt' | 'itemCount' | 'mismatchCount' | 'lastActivityAt'

const STATUS_OPTIONS: { value: SessionStatus | 'all'; label: string }[] = [
  { value: 'all',         label: 'All Statuses' },
  { value: 'active',      label: 'Active' },
  { value: 'reconciling', label: 'Reconciling' },
  { value: 'reconciled',  label: 'Reconciled' },
  { value: 'mismatch',    label: 'Mismatch' },
  { value: 'exited',      label: 'Exited' },
]

export function SessionsPage() {
  const { allSessions, allEvents } = useReconciliation()
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState<SessionStatus | 'all'>('all')
  const [sortKey, setSortKey]             = useState<SortKey>('startedAt')
  const [sortAsc, setSortAsc]             = useState(false)
  const [selectedSession, setSelectedSession] = useState<ShoppingSession | null>(null)

  // Derived metrics from shared allSessions
  const activeCount      = allSessions.filter(s => s.status === 'active').length
  const verifyCount      = allSessions.filter(s => s.mismatchCount > 0).length
  const reconciledCount  = allSessions.filter(s => s.status === 'reconciled').length
  const exitedCount      = allSessions.filter(s => s.status === 'exited').length

  // Filtered + sorted sessions
  const sessions = useMemo(() => {
    let list = allSessions.filter(s => {
      const matchesSearch =
        search.trim() === '' ||
        s.shopperLabel.toLowerCase().includes(search.toLowerCase()) ||
        s.cartId.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter
      return matchesSearch && matchesStatus
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'startedAt')      cmp = new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
      if (sortKey === 'lastActivityAt') cmp = new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime()
      if (sortKey === 'itemCount')      cmp = a.itemCount - b.itemCount
      if (sortKey === 'mismatchCount')  cmp = a.mismatchCount - b.mismatchCount
      return sortAsc ? cmp : -cmp
    })

    return list
  }, [allSessions, search, statusFilter, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  const sessionEvents = selectedSession
    ? allEvents.filter(e => e.sessionId === selectedSession.id).sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      )
    : []
  const sessionCartTwin = selectedSession ? CART_TWIN_BY_SESSION[selectedSession.id] : undefined

  return (
    <div className="px-4 sm:px-6 py-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Live Sessions"
        subtitle="Store sessions with live digital–physical reconciliation status."
      />

      {/* Metric cards */}
      <section aria-label="Session summary metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Active"         value={activeCount}     icon={Activity}     iconColor="text-sky-600"     iconBg="bg-sky-50"     description="Currently shopping" />
        <MetricCard label="Review Needed"  value={verifyCount}     icon={ShieldAlert}  iconColor="text-amber-600"   iconBg="bg-amber-50"   description="Flagged discrepancies" />
        <MetricCard label="Reconciled"     value={reconciledCount} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" description="Matched carts" />
        <MetricCard label="Exited"         value={exitedCount}     icon={LogOut}       iconColor="text-slate-500"   iconBg="bg-slate-100"  description="Sessions closed" />
      </section>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <input
            id="sessions-search"
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cart or session ID…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-slate-400"
            aria-label="Search sessions"
          />
        </div>
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <select
            id="sessions-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as SessionStatus | 'all')}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {sessions.length !== allSessions.length && (
          <span className="text-xs text-slate-500 self-center">
            {sessions.length} of {allSessions.length} sessions
          </span>
        )}
      </div>

      {/* Session table */}
      <Card>
        {sessions.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No sessions found"
            description="Try adjusting your search or filter to see results."
            className="py-16"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Sessions table">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <SortTh label="Session"       sortKey="startedAt"      current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                  <SortTh label="Started"       sortKey="startedAt"      current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <SortTh label="Items"         sortKey="itemCount"      current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Physical</th>
                  <SortTh label="Issues"        sortKey="mismatchCount"  current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <SortTh label="Last Activity" sortKey="lastActivityAt" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sessions.map(session => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    onOpen={() => setSelectedSession(session)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Session detail drawer */}
      <Drawer
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={selectedSession ? `Session — ${selectedSession.shopperLabel}` : ''}
        subtitle={selectedSession ? selectedSession.id : undefined}
        width="xl"
      >
        {selectedSession && (
          <SessionDetail
            session={selectedSession}
            events={sessionEvents}
            cartTwin={sessionCartTwin}
          />
        )}
      </Drawer>
    </div>
  )
}

// ── Table Row ─────────────────────────────────────────────────────────────

function SessionRow({ session, onOpen }: { session: ShoppingSession; onOpen: () => void }) {
  return (
    <tr
      className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      aria-label={`Open session ${session.shopperLabel}`}
    >
      <td className="px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-slate-800">{session.shopperLabel}</p>
            {session.id === ACTIVE_SESSION_ID && (
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Live
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono">{session.cartId}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <SessionStatusBadge status={session.status} dot />
      </td>
      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
        {formatRelativeTime(session.startedAt)}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-medium text-slate-700">{session.itemCount}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={cn(
          'font-medium',
          session.physicalItemCount !== session.itemCount ? 'text-amber-600' : 'text-slate-700',
        )}>
          {session.physicalItemCount}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {session.mismatchCount > 0 ? (
          <Badge variant="danger">{session.mismatchCount}</Badge>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
        {formatRelativeTime(session.lastActivityAt)}
      </td>
      <td className="px-4 py-3 text-slate-600 font-medium text-xs whitespace-nowrap">
        {formatCurrency(session.estimatedTotal)}
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          View →
        </span>
      </td>
    </tr>
  )
}

// ── Sort Header ───────────────────────────────────────────────────────────

function SortTh({ label, sortKey, current, asc, onSort }: {
  label: string; sortKey: SortKey; current: SortKey; asc: boolean; onSort: (k: SortKey) => void
}) {
  const isActive = current === sortKey
  return (
    <th
      className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-slate-700 transition-colors select-none"
      onClick={() => onSort(sortKey)}
      aria-sort={isActive ? (asc ? 'ascending' : 'descending') : 'none'}
    >
      {label} {isActive ? (asc ? '↑' : '↓') : ''}
    </th>
  )
}

// ── Session Detail ────────────────────────────────────────────────────────

import type { ShoppingEvent, CartTwin } from '@/types/domain'
import { EventFeed } from '@/components/overview/EventFeed'

function SessionDetail({
  session,
  events,
  cartTwin,
}: {
  session: ShoppingSession
  events: ShoppingEvent[]
  cartTwin?: CartTwin
}) {
  return (
    <div className="p-5 space-y-6">
      {/* Status row */}
      <div className="flex flex-wrap gap-3">
        <SessionStatusBadge status={session.status} dot />
        <Badge variant="default">
          {session.itemCount} scanned · {session.physicalItemCount} physical
        </Badge>
        {session.mismatchCount > 0 && (
          <Badge variant="danger">{session.mismatchCount} issue{session.mismatchCount !== 1 ? 's' : ''}</Badge>
        )}
      </div>

      {/* Key details */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Cart ID',        value: session.cartId },
          { label: 'Session ID',     value: session.id },
          { label: 'Started',        value: formatRelativeTime(session.startedAt) },
          { label: 'Last Activity',  value: formatRelativeTime(session.lastActivityAt) },
          { label: 'Est. Total',     value: formatCurrency(session.estimatedTotal) },
          { label: 'Digital Items',  value: String(session.itemCount) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{label}</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5 font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Cart Twin snapshot */}
      {cartTwin && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Cart Snapshot</h3>
          <div className="space-y-2">
            {cartTwin.digital.map(item => {
              const physItem = cartTwin.physical.find(p => p.product.sku === item.product.sku)
              const hasDiscrepancy = cartTwin.discrepancies.some(d => d.sku === item.product.sku)
              return (
                <div
                  key={item.product.sku}
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded-lg border',
                    hasDiscrepancy ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100',
                  )}
                >
                  <span className="text-xl" aria-hidden="true">{item.product.imageEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{item.product.sku}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs text-slate-500">Digital <span className="font-semibold text-slate-800">×{item.quantity}</span></p>
                    <p className={cn('text-xs', hasDiscrepancy ? 'text-amber-700' : 'text-slate-500')}>
                      Physical <span className="font-semibold">×{physItem?.quantity ?? 0}</span>
                    </p>
                    {physItem?.observationConfidence !== undefined && (
                      <ConfidenceBar
                        score={physItem.observationConfidence}
                        level={physItem.observationConfidence >= 80 ? 'high' : physItem.observationConfidence >= 60 ? 'medium' : 'low'}
                        className="w-20"
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {cartTwin.discrepancies.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-800 mb-1">
                {cartTwin.discrepancies.length} Suspected Discrepanc{cartTwin.discrepancies.length === 1 ? 'y' : 'ies'}
              </p>
              {cartTwin.discrepancies.map(d => (
                <p key={d.sku} className="text-xs text-amber-700 mt-0.5">
                  <span className="font-mono">{d.sku}</span> — {d.description}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Event History ({events.length})
        </h3>
        {events.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No events recorded for this session.</p>
        ) : (
          <EventFeed events={events} />
        )}
      </div>
    </div>
  )
}
