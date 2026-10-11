/**
 * WorkflowDiagram — visual explanation of the SYNCART reconciliation pipeline.
 *
 * Customer Scan → Physical Interaction → Reconciliation → Resolution → Exit Verification
 */
import { ScanLine, Zap, GitCompare, CheckCircle2, LogOut, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    id: 'scan',
    icon: ScanLine,
    label: 'Customer Scan',
    description: 'Shopper scans product barcode via cart terminal',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  {
    id: 'physical',
    icon: Zap,
    label: 'Physical Interaction',
    description: 'Simulated shelf-interaction event confirms item placement',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    id: 'reconcile',
    icon: GitCompare,
    label: 'Reconciliation',
    description: 'SYNCART compares digital and physical cart states',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  {
    id: 'resolve',
    icon: CheckCircle2,
    label: 'Resolution',
    description: 'Discrepancies are flagged for operator review',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    id: 'exit',
    icon: LogOut,
    label: 'Exit Verification',
    description: 'Confirmed cart clears exit gate',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
] as const

export function WorkflowDiagram() {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-5"
      aria-label="SYNCART workflow: from customer scan to exit verification"
    >
      <h2 className="text-base font-semibold text-slate-800 mb-1">How SYNCART Works</h2>
      <p className="text-xs text-slate-500 mb-5">
        Every shopping session follows this five-stage reconciliation pipeline.
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          return (
            <div key={step.id} className="flex sm:flex-col items-center gap-2 sm:gap-0 flex-1 min-w-0">
              {/* Step box */}
              <div
                className={`flex sm:flex-col items-center gap-2 sm:gap-2 p-3 rounded-xl border ${step.bg} ${step.border} w-full transition-shadow duration-150 hover:shadow-sm`}
                aria-label={`Step ${idx + 1}: ${step.label}`}
              >
                <div className={`w-8 h-8 rounded-lg bg-white border ${step.border} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${step.color}`} aria-hidden="true" />
                </div>
                <div className="sm:text-center min-w-0">
                  <p className={`text-xs font-semibold ${step.color} truncate`}>{step.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
              {/* Arrow */}
              {idx < STEPS.length - 1 && (
                <ArrowRight
                  className="w-4 h-4 text-slate-300 shrink-0 sm:rotate-90 sm:my-1 mx-1 sm:mx-auto"
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-slate-400 mt-4 text-center italic">
        Physical interaction events are simulated. SYNCART does not use live camera surveillance or biometric identification.
      </p>
    </div>
  )
}
