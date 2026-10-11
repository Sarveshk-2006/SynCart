/**
 * Verification Queue — Module E
 *
 * Dedicated operator triage console for flagged cart discrepancies:
 * - Real-time case queue with priority & confidence sorting
 * - Multi-status tabs (Pending, In Review, Resolved, Escalated)
 * - Side-by-side evidence inspection drawer
 * - Interactive resolution workflow with operator audit notes
 * - Batch triage actions & export
 */
import { useState, useMemo } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  ChevronRight,
  Check,
  X,
  FileSpreadsheet,
  AlertOctagon,
  Sparkles,
  Eye,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { VerificationStatusBadge, PriorityBadge } from '@/components/ui/StatusBadge'
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatTimestamp } from '@/data/demo'
import { formatRelativeTime, cn } from '@/lib/utils'
import type { VerificationCase, VerificationStatus, Priority } from '@/types/domain'
import { useReconciliation, ACTIVE_SESSION_ID } from '@/context/ReconciliationContext'

export function VerificationPage() {
  const { allVerificationCases, resolveDiscrepancy } = useReconciliation()
  const [localCaseOverrides, setLocalCaseOverrides] = useState<Record<string, Partial<VerificationCase>>>({})
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<VerificationStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [sortKey, setSortKey] = useState<'priority' | 'createdAt' | 'confidenceScore'>('priority')
  const [selectedCase, setSelectedCase] = useState<VerificationCase | null>(null)
  const [operatorNote, setOperatorNote] = useState('')
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null)

  // Merge shared cases with any immediate UI overrides
  const cases = useMemo(() => {
    return allVerificationCases.map((c) => {
      const override = localCaseOverrides[c.id]
      return override ? { ...c, ...override } : c
    })
  }, [allVerificationCases, localCaseOverrides])

  // Derived counts
  const pendingCount = cases.filter((c) => c.status === 'pending').length
  const inReviewCount = cases.filter((c) => c.status === 'in_review').length
  const highPriorityCount = cases.filter((c) => c.priority === 'high' && c.status !== 'resolved').length
  const resolvedCount = cases.filter((c) => c.status === 'resolved').length

  // Filtered and sorted cases
  const filteredCases = useMemo(() => {
    let list = cases.filter((c) => {
      const matchStatus = statusTab === 'all' || c.status === statusTab
      const matchPriority = priorityFilter === 'all' || c.priority === priorityFilter

      let matchSearch = true
      if (search.trim()) {
        const q = search.toLowerCase()
        matchSearch =
          c.shopperLabel.toLowerCase().includes(q) ||
          c.sessionId.toLowerCase().includes(q) ||
          c.mismatchReason.toLowerCase().includes(q) ||
          Boolean(c.affectedProductName?.toLowerCase().includes(q)) ||
          Boolean(c.affectedSku?.toLowerCase().includes(q)) ||
          c.description.toLowerCase().includes(q)
      }

      return matchStatus && matchPriority && matchSearch
    })

    list = [...list].sort((a, b) => {
      if (sortKey === 'priority') {
        const priorityOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      if (sortKey === 'confidenceScore') {
        return b.confidenceScore - a.confidenceScore
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return list
  }, [cases, statusTab, priorityFilter, search, sortKey])

  // Resolve actions
  const handleUpdateStatus = (
    caseId: string,
    newStatus: VerificationStatus,
    resolutionNote?: string,
  ) => {
    const target = cases.find((c) => c.id === caseId)
    if (target && target.sessionId === ACTIVE_SESSION_ID && target.affectedSku && newStatus === 'resolved') {
      resolveDiscrepancy({
        action: 'operator_verify',
        sku: target.affectedSku,
        note: resolutionNote || 'Resolved from Verification Queue',
      })
    }

    setLocalCaseOverrides((prev) => ({
      ...prev,
      [caseId]: {
        status: newStatus,
        resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : undefined,
        evidence: resolutionNote
          ? `${target?.evidence || ''} [Operator Note: ${resolutionNote}]`
          : target?.evidence,
      },
    }))

    const label =
      newStatus === 'resolved'
        ? 'Case Approved & Resolved'
        : newStatus === 'escalated'
          ? 'Case Escalated to Floor Staff'
          : 'Case Moved to Review'

    setFeedbackToast(`${label} (#${caseId})`)
    setTimeout(() => setFeedbackToast(null), 3500)

    if (selectedCase?.id === caseId) {
      setSelectedCase((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : prev.resolvedAt,
            }
          : null,
      )
    }
  }

  // Batch action: resolve low risk
  const handleBatchResolveLowRisk = () => {
    const lowRiskIds = cases
      .filter((c) => c.priority === 'low' && c.status === 'pending')
      .map((c) => c.id)

    if (lowRiskIds.length === 0) {
      setFeedbackToast('No pending low-risk cases to resolve.')
      setTimeout(() => setFeedbackToast(null), 3000)
      return
    }

    setLocalCaseOverrides((prev) => {
      const updated = { ...prev }
      lowRiskIds.forEach((id) => {
        updated[id] = { status: 'resolved', resolvedAt: new Date().toISOString() }
      })
      return updated
    })
    setFeedbackToast(`Batch resolved ${lowRiskIds.length} low-risk case(s).`)
    setTimeout(() => setFeedbackToast(null), 3500)
  }

  // Export CSV simulator
  const handleExportCSV = () => {
    const header = 'CaseID,SessionID,Shopper,Product,SKU,Reason,Priority,Confidence,Status\n'
    const rows = filteredCases
      .map(
        (c) =>
          `"${c.id}","${c.sessionId}","${c.shopperLabel}","${c.affectedProductName || ''}","${c.affectedSku || ''}","${c.mismatchReason}","${c.priority}","${c.confidenceScore}%","${c.status}"`,
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `verification-queue-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Verification Queue"
        subtitle="Operator triage console for flagged discrepancies and evidence review."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchResolveLowRisk}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Resolve Low-Risk ({cases.filter((c) => c.priority === 'low' && c.status === 'pending').length})</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-medium text-white transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </PageHeader>

      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="text-emerald-600 p-1">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <section aria-label="Queue summary metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Pending Review"
          value={pendingCount}
          description="Awaiting operator decision"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <MetricCard
          label="In Review"
          value={inReviewCount}
          description="Under active investigation"
          icon={Eye}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
        <MetricCard
          label="High Priority Alerts"
          value={highPriorityCount}
          description="Blocking customer exit"
          icon={AlertTriangle}
          iconColor={highPriorityCount > 0 ? 'text-rose-600' : 'text-slate-400'}
          iconBg={highPriorityCount > 0 ? 'bg-rose-50' : 'bg-slate-100'}
        />
        <MetricCard
          label="Resolved Today"
          value={resolvedCount}
          description="Cleared through reconciliation"
          icon={ShieldCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </section>

      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-6 space-y-3">
        {/* Top search & sorting */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cart ID, SKU, product name, or reason…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <span className="text-xs text-slate-500 ml-1">Sort:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="priority">Priority First</option>
              <option value="createdAt">Newest First</option>
              <option value="confidenceScore">Highest Confidence</option>
            </select>
          </div>
        </div>

        {/* Status Tab Strip */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          {(
            [
              { id: 'all',       label: 'All Cases',  count: cases.length },
              { id: 'pending',   label: 'Pending',    count: pendingCount },
              { id: 'in_review', label: 'In Review',  count: inReviewCount },
              { id: 'resolved',  label: 'Resolved',   count: resolvedCount },
              { id: 'escalated', label: 'Escalated',  count: cases.filter((c) => c.status === 'escalated').length },
            ] as const
          ).map((tab) => {
            const isActive = statusTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] leading-tight',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Case Queue Cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Discrepancy Cases ({filteredCases.length})
              </h2>
              <p className="text-xs text-slate-400">
                Sorted by {sortKey === 'priority' ? 'urgency priority' : sortKey}
              </p>
            </div>
          </div>
          <Badge variant="muted">Live Reconciliation Triage</Badge>
        </CardHeader>

        <CardBody className="p-0">
          {filteredCases.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={ShieldCheck}
                title="No Cases Found"
                description="All verification cases for this filter criteria have been processed and resolved."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredCases.map((item) => {
                const isPending = item.status === 'pending'
                const isResolved = item.status === 'resolved'

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/70',
                      item.priority === 'high' && !isResolved && 'bg-rose-50/20',
                      isResolved && 'opacity-70 bg-slate-50/30',
                    )}
                  >
                    {/* Left: Info */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Priority indicator ring */}
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border font-bold text-xs',
                          item.priority === 'high'
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : item.priority === 'medium'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-slate-100 border-slate-200 text-slate-600',
                        )}
                      >
                        <span>{item.confidenceScore}%</span>
                        <span className="text-[8px] uppercase tracking-tighter -mt-0.5">CONF</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-900">
                            {item.shopperLabel}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({item.id})
                          </span>
                          <PriorityBadge priority={item.priority} />
                          <VerificationStatusBadge status={item.status} dot />
                        </div>

                        <p className="text-xs font-semibold text-slate-800 mb-0.5">
                          {item.affectedProductName || 'Multiple Items'}{' '}
                          {item.affectedSku && (
                            <span className="font-mono text-slate-400 font-normal">
                              ({item.affectedSku})
                            </span>
                          )}
                        </p>

                        <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono">
                          <span>Reason: <strong>{item.mismatchReason.replace(/_/g, ' ')}</strong></span>
                          <span>Digital: <strong>×{item.digitalQty ?? 0}</strong></span>
                          <span>Physical: <strong>×{item.physicalQty ?? 0}</strong></span>
                          <span>Created: {formatRelativeTime(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        onClick={() => setSelectedCase(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs"
                      >
                        <span>Inspect Evidence</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      {isPending && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'resolved', 'Cleared by operator quick action')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-medium text-white transition-colors shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'escalated', 'Escalated to floor staff for manual check')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-medium transition-colors"
                          >
                            <AlertOctagon className="w-3 h-3" />
                            <span>Escalate</span>
                          </button>
                        </>
                      )}

                      {item.status === 'in_review' && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'resolved', 'Reviewed and reconciled')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-medium text-white shadow-xs"
                        >
                          Complete Resolution
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Case Investigation Drawer */}
      <Drawer
        isOpen={Boolean(selectedCase)}
        onClose={() => setSelectedCase(null)}
        title={selectedCase ? `Case #${selectedCase.id} — ${selectedCase.shopperLabel}` : 'Case Investigation'}
        subtitle={`Session ID: ${selectedCase?.sessionId || ''}`}
        width="lg"
      >
        {selectedCase && (
          <div className="p-5 space-y-6">
            {/* Status & Priority header */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Investigation Status
                </p>
                <div className="flex items-center gap-2">
                  <VerificationStatusBadge status={selectedCase.status} dot />
                  <PriorityBadge priority={selectedCase.priority} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Flagged At</span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {formatTimestamp(selectedCase.createdAt)}
                </span>
              </div>
            </div>

            {/* Affected Item Details */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Discrepancy Breakdown
              </span>
              <p className="text-base font-bold text-slate-900">
                {selectedCase.affectedProductName || 'Cart Item Discrepancy'}
              </p>
              {selectedCase.affectedSku && (
                <p className="text-xs font-mono text-slate-500">
                  SKU: {selectedCase.affectedSku}
                </p>
              )}
              <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/70 p-3 rounded-lg border border-amber-200/60">
                {selectedCase.description}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-100">
                  <span className="text-[10px] font-bold uppercase text-sky-800 block">Digital Scans</span>
                  <span className="text-lg font-bold text-sky-900">×{selectedCase.digitalQty ?? 0}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Physical Detections</span>
                  <span className="text-lg font-bold text-emerald-900">×{selectedCase.physicalQty ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Sensor Telemetry Evidence */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Sensor Telemetry & Vision Evidence
              </span>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Simulated Vision Confidence</span>
                  <span className="font-bold text-emerald-700">{selectedCase.confidenceScore}%</span>
                </div>
                <ConfidenceBar
                  score={selectedCase.confidenceScore}
                  level={selectedCase.confidence}
                />
              </div>

              {selectedCase.evidence && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  <strong className="text-slate-800 block mb-1">Sensor Log Summary:</strong>
                  {selectedCase.evidence}
                </div>
              )}
            </div>

            {/* Operator Decision Form */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Operator Resolution Workspace
              </span>

              <textarea
                value={operatorNote}
                onChange={(e) => setOperatorNote(e.target.value)}
                placeholder="Add audit notes (e.g. 'Customer confirmed egg carton was replaced on shelf' or 'Verified unscanned item in cart')…"
                rows={3}
                className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              <div className="flex flex-col gap-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedCase.id, 'resolved', operatorNote || 'Reconciled: Confirmed Matched')
                      setOperatorNote('')
                    }}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    Approve & Reconcile
                  </button>

                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedCase.id, 'escalated', operatorNote || 'Escalated to floor staff')
                      setOperatorNote('')
                    }}
                    className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                  >
                    Escalate to Floor
                  </button>
                </div>

                <button
                  onClick={() => {
                    handleUpdateStatus(selectedCase.id, 'in_review', operatorNote || 'Placed under active investigation')
                    setOperatorNote('')
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium"
                >
                  Mark Under Active Investigation
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
