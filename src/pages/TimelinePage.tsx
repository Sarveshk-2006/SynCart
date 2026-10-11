/**
 * Event Timeline — Module D
 *
 * Chronological audit trail of all shopping events:
 * - Scans, physical shelf interactions, returns, mismatches, reconciliations
 * - Multi-criteria filtering (session, event type, severity, keyword search)
 * - Interactive session scrubber / replay mode
 * - Event detail drawer with sensor telemetry inspection
 * - Export audit trail
 */
import { useState, useMemo } from 'react'
import {
  Clock,
  Search,
  ScanLine,
  ShoppingCart,
  Undo2,
  AlertTriangle,
  CheckCircle2,
  LogIn,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  ArrowUpDown,
  Download,
  Play,
  Pause,
  RotateCcw,
  Zap,
  MapPin,
  Tag,
  Copy,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'
import { DEMO_EVENTS, DEMO_SESSIONS, formatTimestamp } from '@/data/demo'
import { useSimulatorEvents } from '@/context/SimulatorEventsContext'
import { formatRelativeTime, cn } from '@/lib/utils'
import type { ShoppingEvent, EventType } from '@/types/domain'

const EVENT_TYPE_OPTIONS: { value: EventType | 'all'; label: string; icon: LucideIcon }[] = [
  { value: 'all',                     label: 'All Events',        icon: Clock },
  { value: 'barcode_scanned',         label: 'Scans',             icon: ScanLine },
  { value: 'product_picked',          label: 'Physical Picks',    icon: ShoppingCart },
  { value: 'product_returned',        label: 'Returns',           icon: Undo2 },
  { value: 'sku_mismatch',            label: 'Mismatches',        icon: AlertTriangle },
  { value: 'reconciliation_complete', label: 'Reconciled',        icon: CheckCircle2 },
  { value: 'verification_requested',  label: 'Verifications',     icon: ShieldAlert },
  { value: 'session_started',         label: 'Session Starts',    icon: LogIn },
  { value: 'session_exited',          label: 'Session Exits',     icon: LogOut },
]

const eventTypeMeta: Record<
  EventType,
  { label: string; icon: LucideIcon; iconBg: string; iconColor: string; badgeVariant: 'info' | 'success' | 'warning' | 'danger' | 'muted' | 'default' }
> = {
  barcode_scanned: {
    label: 'Barcode Scan',
    icon: ScanLine,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    badgeVariant: 'info',
  },
  product_picked: {
    label: 'Physical Pick',
    icon: Zap,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    badgeVariant: 'success',
  },
  product_returned: {
    label: 'Product Return',
    icon: Undo2,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    badgeVariant: 'muted',
  },
  product_moved: {
    label: 'Product Moved',
    icon: ArrowUpDown,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    badgeVariant: 'default',
  },
  product_swapped: {
    label: 'Product Swapped',
    icon: ArrowUpDown,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    badgeVariant: 'warning',
  },
  sku_mismatch: {
    label: 'Discrepancy Flag',
    icon: AlertTriangle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    badgeVariant: 'warning',
  },
  reconciliation_complete: {
    label: 'Reconciliation Clean',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    badgeVariant: 'success',
  },
  reconciliation_evaluated: {
    label: 'Reconciliation Evaluated',
    icon: CheckCircle2,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    badgeVariant: 'info',
  },
  discrepancy_resolved: {
    label: 'Discrepancy Resolved',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    badgeVariant: 'success',
  },
  verification_requested: {
    label: 'Verification Case',
    icon: ShieldAlert,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    badgeVariant: 'danger',
  },
  exit_verification_requested: {
    label: 'Exit Requested',
    icon: ShieldCheck,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    badgeVariant: 'default',
  },
  exit_pass_issued: {
    label: 'Exit Pass Issued',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    badgeVariant: 'success',
  },
  exit_clearance_invalidated: {
    label: 'Pass Invalidated',
    icon: AlertTriangle,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    badgeVariant: 'danger',
  },
  exit_completed: {
    label: 'Trip Completed',
    icon: LogOut,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    badgeVariant: 'muted',
  },
  session_started: {
    label: 'Session Start',
    icon: LogIn,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    badgeVariant: 'muted',
  },
  session_exited: {
    label: 'Session Exit',
    icon: LogOut,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    badgeVariant: 'muted',
  },
}

export function TimelinePage() {
  const [search, setSearch] = useState('')
  const [sessionFilter, setSessionFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [selectedEvent, setSelectedEvent] = useState<ShoppingEvent | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const { allEvents } = useSimulatorEvents()

  // Replay simulator state
  const [isReplaying, setIsReplaying] = useState(false)
  const [replayIndex, setReplayIndex] = useState<number | null>(null)

  // Counts
  const totalEvents = allEvents.length
  const scansCount = allEvents.filter((e) => e.type === 'barcode_scanned').length
  const picksCount = allEvents.filter((e) => e.type === 'product_picked').length
  const mismatchCount = allEvents.filter((e) => e.type === 'sku_mismatch' || e.type === 'verification_requested').length

  // Filtered events
  const filteredEvents = useMemo(() => {
    let list = allEvents.filter((e) => {
      const matchSession = sessionFilter === 'all' || e.sessionId === sessionFilter
      const matchType = typeFilter === 'all' || e.type === typeFilter
      const matchSeverity = severityFilter === 'all' || e.severity === severityFilter

      let matchSearch = true
      if (search.trim()) {
        const q = search.toLowerCase()
        matchSearch =
          e.description.toLowerCase().includes(q) ||
          Boolean(e.productName?.toLowerCase().includes(q)) ||
          Boolean(e.sku?.toLowerCase().includes(q)) ||
          Boolean(e.locationLabel?.toLowerCase().includes(q)) ||
          e.sessionId.toLowerCase().includes(q)
      }

      return matchSession && matchType && matchSeverity && matchSearch
    })

    list = [...list].sort((a, b) => {
      const timeA = new Date(a.occurredAt).getTime()
      const timeB = new Date(b.occurredAt).getTime()
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB
    })

    // If replaying, slice up to current index
    if (replayIndex !== null) {
      const chronological = [...list].sort(
        (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
      )
      return chronological.slice(0, replayIndex + 1)
    }

    return list
  }, [allEvents, sessionFilter, typeFilter, severityFilter, search, sortOrder, replayIndex])

  // Replay handlers
  const handleToggleReplay = () => {
    if (isReplaying) {
      setIsReplaying(false)
    } else {
      setIsReplaying(true)
      if (replayIndex === null || replayIndex >= DEMO_EVENTS.length - 1) {
        setReplayIndex(0)
      }
    }
  }

  const handleResetReplay = () => {
    setIsReplaying(false)
    setReplayIndex(null)
  }

  const handleCopyPayload = (event: ShoppingEvent) => {
    const payload = JSON.stringify(
      {
        eventId: event.id,
        sessionId: event.sessionId,
        type: event.type,
        timestamp: event.occurredAt,
        productName: event.productName,
        sku: event.sku,
        confidence: event.confidence,
        location: event.locationLabel,
        description: event.description,
      },
      null,
      2,
    )
    navigator.clipboard.writeText(payload)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDownloadLog = () => {
    const json = JSON.stringify(filteredEvents, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `syncart-audit-log-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Event Timeline"
        subtitle="Chronological audit trail of customer scans, physical observations, and reconciliation decisions."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadLog}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Log</span>
          </button>
        </div>
      </PageHeader>

      {/* Metric Cards Row */}
      <section aria-label="Timeline metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Events"
          value={totalEvents}
          description="In session buffer"
          icon={Clock}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <MetricCard
          label="Customer Scans"
          value={scansCount}
          description="Terminal barcode scans"
          icon={ScanLine}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
        <MetricCard
          label="Physical Detections"
          value={picksCount}
          description="Simulated shelf sensors"
          icon={ShoppingCart}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <MetricCard
          label="Discrepancies Flagged"
          value={mismatchCount}
          description="Reconciliation cases"
          icon={AlertTriangle}
          iconColor={mismatchCount > 0 ? 'text-amber-600' : 'text-slate-400'}
          iconBg={mismatchCount > 0 ? 'bg-amber-50' : 'bg-slate-100'}
        />
      </section>

      {/* Replay Mode Bar */}
      <div className="mb-6 bg-slate-900 text-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs select-none">
              REC
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Session Audit Playback</p>
              <p className="text-[11px] text-slate-400">
                Step through event telemetry chronologically.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleReplay}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                isReplaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white',
              )}
            >
              {isReplaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isReplaying ? 'Pause Playback' : 'Replay Timeline'}</span>
            </button>
            {replayIndex !== null && (
              <button
                onClick={handleResetReplay}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Show All</span>
              </button>
            )}
          </div>
        </div>

        {replayIndex !== null && (
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Event {replayIndex + 1} of {allEvents.length}</span>
              <span>
                {filteredEvents[filteredEvents.length - 1]
                  ? formatTimestamp(filteredEvents[filteredEvents.length - 1].occurredAt)
                  : ''}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={allEvents.length - 1}
              value={replayIndex}
              onChange={(e) => setReplayIndex(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, SKU, description, aisle…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Session Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Session:</span>
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Sessions ({DEMO_SESSIONS.length})</option>
              {DEMO_SESSIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shopperLabel} ({s.cartId})
                </option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error / Mismatch</option>
              <option value="success">Success</option>
            </select>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 font-medium"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>

        {/* Event Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          {EVENT_TYPE_OPTIONS.map((opt) => {
            const isSelected = typeFilter === opt.value
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors',
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Timeline Stream */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Audit Stream ({filteredEvents.length} events)
              </h2>
              <p className="text-xs text-slate-400">
                Sorted by {sortOrder === 'newest' ? 'most recent first' : 'oldest first'}
              </p>
            </div>
          </div>
          <Badge variant="muted">Live Store Event Buffer</Badge>
        </CardHeader>

        <CardBody className="p-0">
          {filteredEvents.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Clock}
                title="No Events Found"
                description="No events match your current filter criteria. Try resetting your search or filter tags."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEvents.map((event) => {
                const meta = eventTypeMeta[event.type] || eventTypeMeta.product_picked
                const Icon = meta.icon
                const isMismatch = event.severity === 'error' || event.type === 'sku_mismatch'
                const isWarning = event.severity === 'warning'
                const isSuccess = event.severity === 'success'

                return (
                  <div
                    key={event.id}
                    className={cn(
                      'p-4 flex items-start gap-3 sm:gap-4 transition-colors hover:bg-slate-50/70 cursor-pointer',
                      isMismatch && 'bg-rose-50/30',
                      isWarning && 'bg-amber-50/30',
                      isSuccess && 'bg-emerald-50/20',
                    )}
                    onClick={() => setSelectedEvent(event)}
                  >
                    {/* Timestamp column */}
                    <div className="w-16 sm:w-20 shrink-0 text-right">
                      <p className="text-xs font-mono font-bold text-slate-800">
                        {formatTimestamp(event.occurredAt)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-sans">
                        {formatRelativeTime(event.occurredAt)}
                      </p>
                    </div>

                    {/* Timeline Node Icon */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5',
                        meta.iconBg,
                        isMismatch ? 'border-rose-200' : isWarning ? 'border-amber-200' : 'border-slate-200',
                      )}
                    >
                      <Icon className={cn('w-4 h-4', meta.iconColor)} />
                    </div>

                    {/* Event Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-900">
                          {event.productName || meta.label}
                        </span>
                        <Badge variant={meta.badgeVariant} className="text-[10px]">
                          {meta.label}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Session: {event.sessionId}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-2">
                        {event.description}
                      </p>

                      {/* Metadata Chips */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        {event.sku && (
                          <div className="flex items-center gap-1 font-mono">
                            <Tag className="w-3 h-3 text-slate-400" />
                            <span>{event.sku}</span>
                          </div>
                        )}
                        {event.locationLabel && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{event.locationLabel}</span>
                          </div>
                        )}
                        {event.confidence !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-emerald-500" />
                            <span>Confidence:</span>
                            <span className="font-semibold text-emerald-700">
                              {event.confidence}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detail Chevron */}
                    <div className="shrink-0 pt-1 text-slate-400 hover:text-slate-600">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Event Telemetry Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.productName || 'Event Telemetry Detail'}
        subtitle={`Event ID: ${selectedEvent?.id || ''}`}
        width="lg"
      >
        {selectedEvent && (
          <div className="p-5 space-y-6">
            {/* Header Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Event Classification
                </span>
                <Badge
                  variant={
                    eventTypeMeta[selectedEvent.type]?.badgeVariant || 'default'
                  }
                >
                  {eventTypeMeta[selectedEvent.type]?.label || selectedEvent.type}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedEvent.description}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 pt-3 border-t border-slate-200">
                <span>Timestamp: <strong>{formatTimestamp(selectedEvent.occurredAt)}</strong></span>
                <span>Session: <strong>{selectedEvent.sessionId}</strong></span>
              </div>
            </div>

            {/* Product details if applicable */}
            {selectedEvent.sku && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Linked Product SKU
                </span>
                <p className="text-sm font-bold text-slate-900">{selectedEvent.productName}</p>
                <p className="text-xs font-mono text-slate-500">SKU: {selectedEvent.sku}</p>
              </div>
            )}

            {/* Simulated Edge Sensor Telemetry */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Edge Coordinator Sensor Telemetry
              </span>

              {selectedEvent.confidence !== undefined && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Simulated Vision Confidence</span>
                    <span className="font-bold text-emerald-700">{selectedEvent.confidence}%</span>
                  </div>
                  <ConfidenceBar
                    score={selectedEvent.confidence}
                    level={selectedEvent.confidence >= 80 ? 'high' : 'medium'}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">ZONE / AISLE</span>
                  <span className="text-slate-800 font-semibold">{selectedEvent.locationLabel || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SEVERITY</span>
                  <span className="text-slate-800 font-semibold uppercase">{selectedEvent.severity || 'INFO'}</span>
                </div>
              </div>
            </div>

            {/* Raw JSON Payload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Raw Ingest Telemetry JSON
                </span>
                <button
                  onClick={() => handleCopyPayload(selectedEvent)}
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy Payload'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(
                  {
                    eventId: selectedEvent.id,
                    sessionId: selectedEvent.sessionId,
                    type: selectedEvent.type,
                    timestamp: selectedEvent.occurredAt,
                    product: {
                      name: selectedEvent.productName,
                      sku: selectedEvent.sku,
                    },
                    telemetry: {
                      confidence: selectedEvent.confidence,
                      location: selectedEvent.locationLabel,
                      severity: selectedEvent.severity,
                    },
                    auditDescription: selectedEvent.description,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
