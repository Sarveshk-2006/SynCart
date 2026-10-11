/**
 * Settings — Store Operations Configuration
 *
 * Store profile, reconciliation confidence thresholds,
 * auto-escalation parameters, display preferences, and system telemetry health.
 */
import { useState } from 'react'
import {
  Store,
  Sliders,
  Eye,
  RotateCcw,
  Save,
  CheckCircle2,
  Server,
  Info,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DEFAULT_SETTINGS } from '@/data/demo'
import { cn } from '@/lib/utils'
import type { DemoSettings } from '@/types/domain'

export function SettingsPage() {
  const [settings, setSettings] = useState<DemoSettings>(DEFAULT_SETTINGS)
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)

  // Handlers
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackNotice('Settings saved successfully and applied to active reconciliation engine.')
    setTimeout(() => {
      setFeedbackNotice(null)
    }, 3500)
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    setFeedbackNotice('Settings restored to Greenfield Market demo defaults.')
    setTimeout(() => setFeedbackNotice(null), 3000)
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Settings & Configuration"
        subtitle="Store environment parameters, reconciliation thresholds, and console preferences."
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restore Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-medium text-white transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </PageHeader>

      {/* Save Feedback Banner */}
      {feedbackNotice && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{feedbackNotice}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Store Environment Profile</h2>
                <p className="text-xs text-slate-400">Identity and localized zone configuration</p>
              </div>
            </div>
            <Badge variant="success">Active Demo Node</Badge>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Facility Name
                </label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Identifier Code
                </label>
                <input
                  type="text"
                  value={settings.storeId}
                  onChange={(e) => setSettings({ ...settings, storeId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Deployment Type</span>
                <span className="font-semibold text-slate-800">Edge Local Coordinator</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Active Lanes</span>
                <span className="font-semibold text-slate-800">8 Self-Checkout Lanes</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Shelf Sensor Zones</span>
                <span className="font-semibold text-slate-800">4 Monitored Aisles</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Reconciliation Engine Tuning */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Reconciliation Engine Parameters
                </h2>
                <p className="text-xs text-slate-400">
                  Tolerances and automated discrepancy detection thresholds
                </p>
              </div>
            </div>
            <Badge variant="info">Real-Time Core</Badge>
          </CardHeader>
          <CardBody className="space-y-5">
            {/* Confidence Threshold Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block">
                    Discrepancy Confidence Threshold
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Shelf detection events below this confidence percentage are flagged for operator verification.
                  </p>
                </div>
                <span className="text-sm font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {settings.reconciliationThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                value={settings.reconciliationThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, reconciliationThreshold: Number(e.target.value) })
                }
                className="w-full accent-emerald-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>50% (Permissive / Fewer flags)</span>
                <span>70% (Standard)</span>
                <span>95% (Strict / More verifications)</span>
              </div>
            </div>

            {/* Auto-escalate timer */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block">
                    Auto-Escalate Pending Cases Timeout
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Duration an unaddressed discrepancy remains in pending status before escalating to floor supervisor.
                  </p>
                </div>
                <span className="text-sm font-bold font-mono text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  {settings.autoEscalateAfterMins} mins
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={settings.autoEscalateAfterMins}
                onChange={(e) =>
                  setSettings({ ...settings, autoEscalateAfterMins: Number(e.target.value) })
                }
                className="w-full accent-emerald-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>5 mins</span>
                <span>15 mins (Default)</span>
                <span>60 mins</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Display & Console Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Console Display Preferences</h2>
                <p className="text-xs text-slate-400">Formatting and UI layout behavior</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Timestamp Display Format</span>
                <p className="text-[11px] text-slate-400">
                  Display dates as relative elapsed time (&quot;12 min ago&quot;) or absolute wall-clock time (&quot;09:18:24&quot;).
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showTimestamps: 'relative' })}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-colors',
                    settings.showTimestamps === 'relative'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  Relative
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showTimestamps: 'absolute' })}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-colors',
                    settings.showTimestamps === 'absolute'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  Absolute
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Compact Row Density</span>
                <p className="text-[11px] text-slate-400">
                  Reduce vertical padding in tables and lists for dense multi-monitor console displays.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => setSettings({ ...settings, compactMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </CardBody>
        </Card>

        {/* System Telemetry & Edge Coordinator Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">System Telemetry & Edge Coordinator</h2>
                <p className="text-xs text-slate-400">Hardware connectivity and simulated pipeline status</p>
              </div>
            </div>
            <Badge variant="success" dot>
              Connected (Localhost)
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] block uppercase font-mono">Telemetry Pipe</span>
                <span className="font-bold text-slate-900">WebSocket / Mock</span>
                <span className="text-emerald-600 block text-[10px] mt-0.5">● 100% packets</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] block uppercase font-mono">Edge Ingest Latency</span>
                <span className="font-bold text-slate-900">14 ms avg</span>
                <span className="text-slate-500 block text-[10px] mt-0.5">Simulated</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] block uppercase font-mono">Camera Feeds</span>
                <span className="font-bold text-slate-900">4 Simulated</span>
                <span className="text-slate-500 block text-[10px] mt-0.5">Non-PII mode</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] block uppercase font-mono">Reconciliation Buffer</span>
                <span className="font-bold text-slate-900">8 Active Carts</span>
                <span className="text-emerald-600 block text-[10px] mt-0.5">Memory sync OK</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-sky-50/60 border border-sky-100 flex items-start gap-2 text-xs text-sky-800">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                SYNCART operates in <strong>Simulated Demonstration Mode</strong>. Computer vision observations and shelf telemetry are deterministically generated from Greenfield Market store scenarios without real camera streaming.
              </span>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  )
}
