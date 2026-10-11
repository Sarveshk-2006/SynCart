/**
 * VisionPage — Vision & Shopping Event Simulator (Phase 3)
 *
 * Workspace for simulating retail computer-vision and shelf-interaction events:
 * - Supermarket shelf visualization with bounding-box detection overlays
 * - Interactive event generator (PICK, RETURN, MOVE, SWAP)
 * - Deterministic scenario presets
 * - Chronological simulated event history with filtering and search
 * - Evidence & sensor telemetry inspector drawer
 */
import { useState } from 'react'
import {
  Eye,
  Zap,
  Undo2,
  ArrowUpDown,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Trash2,
  ChevronRight,
  X,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { DEMO_SESSIONS, formatTimestamp } from '@/data/demo'
import {
  useSimulatorEvents,
  PRESET_SCENARIOS,
  type PresetScenario,
} from '@/context/SimulatorEventsContext'
import { formatCurrency, cn } from '@/lib/utils'
import type {
  ShelfZone,
  ShelfSlot,
  SimulatedVisionEvent,
  SimulatedInteractionType,
} from '@/types/domain'

const INTERACTION_CONFIG: Record<
  SimulatedInteractionType,
  { label: string; icon: LucideIcon; badgeVariant: 'success' | 'info' | 'warning' | 'danger'; desc: string }
> = {
  PICK: {
    label: 'PICK',
    icon: Zap,
    badgeVariant: 'success',
    desc: 'Product lifted or removed from shelf',
  },
  RETURN: {
    label: 'RETURN',
    icon: Undo2,
    badgeVariant: 'info',
    desc: 'Product placed back on shelf',
  },
  MOVE: {
    label: 'MOVE',
    icon: ArrowUpDown,
    badgeVariant: 'warning',
    desc: 'Product displaced within shelf zone',
  },
  SWAP: {
    label: 'SWAP',
    icon: RefreshCw,
    badgeVariant: 'danger',
    desc: 'Product swapped with another SKU',
  },
}

export function VisionPage() {
  const {
    shelfZones,
    simulatedEvents,
    generateEvent,
    runPreset,
    clearSimulatorHistory,
  } = useSimulatorEvents()

  // Selected state
  const [activeZoneId, setActiveZoneId] = useState<string>(shelfZones[0]?.id || 'zone-dairy')
  const [selectedSlot, setSelectedSlot] = useState<ShelfSlot>(
    shelfZones[0]?.products[0] || ({} as ShelfSlot),
  )
  const [selectedSessionId, setSelectedSessionId] = useState<string>(DEMO_SESSIONS[0].id)
  const [selectedInteraction, setSelectedInteraction] = useState<SimulatedInteractionType>('PICK')
  const [confidenceInput, setConfidenceInput] = useState<number>(92)
  const [scenarioNote, setScenarioNote] = useState<string>('')
  const [inspectedEvent, setInspectedEvent] = useState<SimulatedVisionEvent | null>(null)

  // Filters & search for event history
  const [historySearch, setHistorySearch] = useState<string>('')
  const [historyTypeFilter, setHistoryTypeFilter] = useState<SimulatedInteractionType | 'ALL'>('ALL')
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false)

  // Current zone
  const currentZone: ShelfZone =
    shelfZones.find((z) => z.id === activeZoneId) || shelfZones[0]

  // Handlers
  const handleSelectSlot = (slot: ShelfSlot) => {
    setSelectedSlot(slot)
  }

  const handleGenerate = () => {
    if (!selectedSlot?.product) return

    const newEvt = generateEvent({
      sessionId: selectedSessionId,
      productSku: selectedSlot.product.sku,
      shelfZoneId: currentZone.id,
      slotPosition: selectedSlot.position,
      interactionType: selectedInteraction,
      confidence: confidenceInput,
      scenarioNote: scenarioNote.trim() || undefined,
    })

    setFeedbackNotice(
      `Generated ${newEvt.interactionType} event for ${selectedSlot.product.name} (Conf: ${newEvt.confidence}%)`,
    )
    setTimeout(() => setFeedbackNotice(null), 3500)
    setScenarioNote('')
  }

  const handleRunPreset = (preset: PresetScenario) => {
    const newEvt = runPreset(preset.id)
    if (newEvt) {
      setActiveZoneId(preset.zoneId)
      const zone = shelfZones.find((z) => z.id === preset.zoneId)
      const slot = zone?.products.find((s) => s.position === preset.position)
      if (slot) setSelectedSlot(slot)

      setFeedbackNotice(`Triggered preset: "${preset.title}"`)
      setTimeout(() => setFeedbackNotice(null), 3500)
    }
  }

  const handleClearHistory = () => {
    clearSimulatorHistory()
    setShowClearConfirm(false)
    setFeedbackNotice('Simulator demo history cleared and shelf stock restored.')
    setTimeout(() => setFeedbackNotice(null), 3000)
  }

  // Filtered history list
  const filteredEvents = simulatedEvents.filter((evt) => {
    const matchesType =
      historyTypeFilter === 'ALL' || evt.interactionType === historyTypeFilter
    const q = historySearch.toLowerCase().trim()
    const matchesSearch =
      q === '' ||
      evt.productName?.toLowerCase().includes(q) ||
      evt.sku?.toLowerCase().includes(q) ||
      evt.sessionId.toLowerCase().includes(q) ||
      evt.locationLabel?.toLowerCase().includes(q) ||
      evt.id.toLowerCase().includes(q)
    return matchesType && matchesSearch
  })

  return (
    <div className="px-4 sm:px-6 py-6 max-w-[1400px] mx-auto space-y-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <PageHeader
        title="Vision Simulator"
        subtitle="Simulated shelf-interaction event generator with optical and weight telemetry."
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SIMULATED VISION
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Coordinator: Edge-01 (Mock)
          </span>
        </div>
      </PageHeader>

      {/* Feedback Toast */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedbackNotice}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)} className="text-emerald-700 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Metric Cards KPI Bar ───────────────────────────────── */}
      <section aria-label="Simulator metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Simulated Events"
          value={simulatedEvents.length}
          description="Session buffer"
          icon={Eye}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <MetricCard
          label="Shelf Zones"
          value={shelfZones.length}
          description="Optical + weight grid"
          icon={Layers}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <MetricCard
          label="Picks"
          value={simulatedEvents.filter((e) => e.interactionType === 'PICK').length}
          description="Simulated item lifts"
          icon={Zap}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
        <MetricCard
          label="Adjustments"
          value={simulatedEvents.filter((e) => e.interactionType !== 'PICK').length}
          description="Returns, moves & swaps"
          icon={ArrowUpDown}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </section>

      {/* ── Presets Quick Bar ──────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900">Deterministic Scenario Presets</span>
          </div>
          <span className="text-[11px] text-slate-400">One-click simulated event scenarios</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {PRESET_SCENARIOS.map((preset) => {
            const config = INTERACTION_CONFIG[preset.interactionType]
            const Icon = config.icon
            return (
              <button
                key={preset.id}
                onClick={() => handleRunPreset(preset)}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/60 hover:border-emerald-300 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate flex items-center gap-1">
                      <Icon className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                      <span>{preset.title}</span>
                    </span>
                    <Badge variant={config.badgeVariant} className="text-[9px] px-1 py-0">
                      {preset.interactionType}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                    {preset.description}
                  </p>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{preset.product.imageEmoji} {preset.product.name.split(' ')[0]}</span>
                  <span>{preset.confidence}% conf</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main Two-Column Workspace ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Column A: Shelf Visualization (7 cols) ───────────── */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Supermarket Shelf Visualization — {currentZone.label}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentZone.aisle} · Real-time simulated optical bounding boxes and weight sensors
                </p>
              </div>

              {/* Zone switcher tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs overflow-x-auto">
                {shelfZones.map((z) => {
                  const isZoneActive = z.id === activeZoneId
                  return (
                    <button
                      key={z.id}
                      onClick={() => {
                        setActiveZoneId(z.id)
                        setSelectedSlot(z.products[0])
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors',
                        isZoneActive
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900',
                      )}
                    >
                      {z.label}
                    </button>
                  )
                })}
              </div>
            </CardHeader>

            <CardBody className="space-y-4">
              {/* Simulated Camera Feed Frame Header */}
              <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-slate-300">OPTICAL-OVERLAY · {currentZone.aisle.toUpperCase()}</span>
                </div>
                <span className="text-emerald-400 text-[11px]">WEIGHT SENSORS CALIBRATED</span>
              </div>

              {/* Physical Shelf Rack Visual */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 border-2 border-slate-300 shadow-inner space-y-6">
                {/* Shelf Bay 1 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                    <span>BAY 1 — EYE LEVEL</span>
                    <span>SLOTS: {currentZone.products.map((p) => p.position).join(', ')}</span>
                  </div>

                  {/* Shelf Slots Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {currentZone.products.map((slot) => {
                      const isSelected = selectedSlot?.position === slot.position
                      const recent = slot.recentInteraction
                      const stockPct = Math.round((slot.currentStock / slot.expectedStock) * 100)

                      return (
                        <div
                          key={slot.position}
                          onClick={() => handleSelectSlot(slot)}
                          className={cn(
                            'relative p-3 rounded-xl bg-white border-2 transition-all cursor-pointer shadow-xs group',
                            isSelected
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-102 bg-emerald-50/30'
                              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/80',
                          )}
                        >
                          {/* Simulated CV Bounding Box Reticle Overlay */}
                          <div
                            className={cn(
                              'absolute inset-1 rounded-lg border-dashed border transition-opacity pointer-events-none',
                              isSelected
                                ? 'border-emerald-500 border-2 opacity-100'
                                : 'border-slate-300 opacity-60 group-hover:opacity-100',
                            )}
                          >
                            <span
                              className={cn(
                                'absolute -top-2.5 left-1.5 px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-tight',
                                isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200',
                              )}
                            >
                              POS:{slot.position} · {slot.product.sku.slice(-5)}
                            </span>
                          </div>

                          {/* Slot Content */}
                          <div className="flex flex-col items-center text-center pt-2">
                            <span className="text-4xl filter drop-shadow-xs mb-1.5 group-hover:scale-105 transition-transform">
                              {slot.product.imageEmoji}
                            </span>
                            <p className="text-xs font-bold text-slate-900 truncate w-full">
                              {slot.product.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {formatCurrency(slot.product.priceUsd)}
                            </p>

                            {/* Stock Indicator */}
                            <div className="w-full mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                              <span className="text-slate-500">Stock:</span>
                              <span
                                className={cn(
                                  'font-bold font-mono',
                                  slot.currentStock === 0
                                    ? 'text-rose-600'
                                    : slot.currentStock < slot.expectedStock
                                      ? 'text-amber-600'
                                      : 'text-emerald-700',
                                )}
                              >
                                {slot.currentStock}/{slot.expectedStock}
                              </span>
                            </div>

                            {/* Mini Stock Bar */}
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                              <div
                                className={cn(
                                  'h-full transition-all duration-300',
                                  stockPct >= 80 ? 'bg-emerald-500' : stockPct >= 40 ? 'bg-amber-400' : 'bg-rose-500',
                                )}
                                style={{ width: `${Math.min(100, stockPct)}%` }}
                              />
                            </div>

                            {/* Recent Interaction Badge */}
                            {recent && (
                              <div className="mt-2 w-full">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-bold uppercase w-full justify-center">
                                  <span>{recent.type}</span>
                                  <span>({recent.confidence}%)</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Metallic Shelf Bracket Bar */}
                <div className="h-3 rounded-md bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 border border-slate-400 shadow-sm" />
              </div>

              {/* Legend & Disclaimer */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md border-2 border-emerald-500 bg-emerald-50" />
                    <span>Selected Slot</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md border border-dashed border-slate-400" />
                    <span>Optical Bounding Box</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Recent Interaction</span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 italic">
                  Note: Visualizations and telemetry are simulated. No live webcam feed.
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* ── Column B: Event Generator Controls (5 cols) ────────── */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Interaction Generator</h2>
                <p className="text-xs text-slate-400">
                  Emit synthetic shelf events into the SYNCART reconciliation pipeline
                </p>
              </div>
              <Badge variant="info">Manual Dispatch</Badge>
            </CardHeader>

            <CardBody className="space-y-4">
              {/* Target Slot & Product Preview */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <span className="text-3xl shrink-0">{selectedSlot?.product?.imageEmoji || '📦'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {selectedSlot?.product?.name || 'No slot selected'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    {selectedSlot?.product?.sku} · Slot {selectedSlot?.position} ({currentZone.label})
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Current Stock: <strong>{selectedSlot?.currentStock} units</strong>
                  </p>
                </div>
              </div>

              {/* 1. Target Session Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associate with Active Session
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {DEMO_SESSIONS.map((sess) => (
                    <option key={sess.id} value={sess.id}>
                      {sess.shopperLabel} ({sess.cartId}) — Status: {sess.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Interaction Type (PICK, RETURN, MOVE, SWAP) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Interaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PICK', 'RETURN', 'MOVE', 'SWAP'] as SimulatedInteractionType[]).map((type) => {
                    const cfg = INTERACTION_CONFIG[type]
                    const Icon = cfg.icon
                    const isSelected = selectedInteraction === type
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedInteraction(type)}
                        className={cn(
                          'p-2.5 rounded-xl border text-left transition-all flex items-start gap-2',
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500 shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50',
                        )}
                      >
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{cfg.label}</p>
                          <p className="text-[10px] text-slate-500 leading-tight">{cfg.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. Illustrative Confidence Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Illustrative Detection Confidence
                  </label>
                  <span
                    className={cn(
                      'text-xs font-bold font-mono px-2 py-0.5 rounded-md',
                      confidenceInput >= 80
                        ? 'bg-emerald-50 text-emerald-700'
                        : confidenceInput >= 60
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700',
                    )}
                  >
                    {confidenceInput}%
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={99}
                  value={confidenceInput}
                  onChange={(e) => setConfidenceInput(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>30% (Low / Ambiguous)</span>
                  <span>70% (Threshold)</span>
                  <span>99% (High / Definite)</span>
                </div>
              </div>

              {/* 4. Optional Scenario Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scenario Annotation (Optional)
                </label>
                <input
                  type="text"
                  value={scenarioNote}
                  onChange={(e) => setScenarioNote(e.target.value)}
                  placeholder="e.g. 'Customer picked egg carton while holding child in cart'…"
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* 5. Dispatch Action Button */}
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Zap className="w-4 h-4 text-emerald-300" />
                <span>
                  Generate Simulated {selectedInteraction} Event
                </span>
              </button>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── Section D: Simulated Event History Stream ───────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Simulated Event Log ({filteredEvents.length} events)
              </h2>
              <p className="text-xs text-slate-400">
                Audit trail of synthetic vision telemetry generated during this demo session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {simulatedEvents.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-xs text-slate-600 font-medium transition-colors shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </CardHeader>

        <CardBody className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="search"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search event ID, product, SKU, or session…"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Event Type Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {(['ALL', 'PICK', 'RETURN', 'MOVE', 'SWAP'] as (SimulatedInteractionType | 'ALL')[]).map((tab) => {
                const isSelected = historyTypeFilter === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setHistoryTypeFilter(tab)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-medium transition-colors',
                      isSelected
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Events Table / List */}
          {filteredEvents.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={Eye}
                title="No Simulated Events in History"
                description="Use the Interaction Generator or Preset Scenarios above to emit simulated shelf interaction events."
              />
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {filteredEvents.map((evt) => {
                const config = INTERACTION_CONFIG[evt.interactionType]
                const Icon = config.icon

                return (
                  <div
                    key={evt.id}
                    onClick={() => setInspectedEvent(evt)}
                    className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-700" />
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-slate-900">
                            {evt.productName}
                          </span>
                          <Badge variant={config.badgeVariant} className="text-[10px]">
                            {evt.interactionType}
                          </Badge>
                          <span className="text-[10px] font-mono text-slate-400">
                            {evt.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {evt.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div className="hidden sm:block">
                        <span className="text-xs font-bold font-mono text-slate-800">
                          {evt.confidence}% conf
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {formatTimestamp(evt.occurredAt)}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Section C: Event Evidence Inspector Drawer ─────────── */}
      <Drawer
        isOpen={Boolean(inspectedEvent)}
        onClose={() => setInspectedEvent(null)}
        title={inspectedEvent ? `Event #${inspectedEvent.id}` : 'Evidence Inspector'}
        subtitle={`Session: ${inspectedEvent?.sessionId || ''}`}
        width="lg"
      >
        {inspectedEvent && (
          <div className="p-5 space-y-5">
            {/* Classification Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Telemetry Event Type
                </span>
                <Badge variant={INTERACTION_CONFIG[inspectedEvent.interactionType].badgeVariant}>
                  {inspectedEvent.interactionType}
                </Badge>
              </div>
              <p className="text-base font-bold text-slate-900">
                {inspectedEvent.productName}
              </p>
              <p className="text-xs font-mono text-slate-500">
                SKU: {inspectedEvent.sku} · Location: {inspectedEvent.locationLabel}
              </p>
            </div>

            {/* Confidence Gauge */}
            {(() => {
              const conf = inspectedEvent.confidence ?? 0
              return (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-semibold">Simulated Detection Confidence</span>
                    <span className="font-bold font-mono text-emerald-700">{conf}%</span>
                  </div>
                  <ConfidenceBar
                    score={conf}
                    level={conf >= 80 ? 'high' : conf >= 60 ? 'medium' : 'low'}
                  />
                  {conf < 50 && (
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                      <strong>Low-Confidence Notice:</strong> Observation is uncertain (&lt;50%). In a live deployment, this would be flagged as a provisional observation requiring multi-sensor fusion.
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Before / After Shelf State */}
            {inspectedEvent.beforeStock !== undefined && inspectedEvent.afterStock !== undefined && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Shelf Stock State Delta
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-mono">STOCK BEFORE</span>
                    <span className="text-lg font-bold text-slate-900">{inspectedEvent.beforeStock} units</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-emerald-700 block text-[10px] font-mono">STOCK AFTER</span>
                    <span className="text-lg font-bold text-emerald-900">{inspectedEvent.afterStock} units</span>
                  </div>
                </div>
              </div>
            )}

            {/* Scenario Annotation */}
            {inspectedEvent.scenarioNote && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Scenario Explanation
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {inspectedEvent.scenarioNote}
                </p>
              </div>
            )}

            {/* Raw Edge Ingest Payload JSON */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Simulated Edge Telemetry Payload
              </span>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(
                  {
                    eventId: inspectedEvent.id,
                    interaction: inspectedEvent.interactionType,
                    product: {
                      name: inspectedEvent.productName,
                      sku: inspectedEvent.sku,
                    },
                    shelf: {
                      zone: inspectedEvent.shelfZoneLabel,
                      aisle: inspectedEvent.aisle,
                      position: inspectedEvent.slotPosition,
                    },
                    telemetry: {
                      confidence: inspectedEvent.confidence,
                      timestamp: inspectedEvent.occurredAt,
                      source: inspectedEvent.sourceLabel,
                    },
                    stockDelta: {
                      before: inspectedEvent.beforeStock,
                      after: inspectedEvent.afterStock,
                    },
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        )}
      </Drawer>

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Clear Simulator History?</h3>
                <p className="text-xs text-slate-500">
                  This will reset all synthetic vision events and restore default shelf stock.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
