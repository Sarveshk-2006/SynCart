/**
 * PlaceholderPage — polished placeholder for Phase 1+ routes.
 *
 * Clearly communicates: what the module will do, and that it is not yet implemented.
 * Does not pretend functionality exists.
 */
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlaceholderPageProps {
  icon: LucideIcon
  moduleName: string
  route: string
  description: string
  plannedFeatures: string[]
  phase?: string
  accentColor?: string
  accentBg?: string
}

export function PlaceholderPage({
  icon: Icon,
  moduleName,
  route,
  description,
  plannedFeatures,
  phase = 'Phase 1',
  accentColor = 'text-emerald-600',
  accentBg = 'bg-emerald-50',
}: PlaceholderPageProps) {
  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Module icon + name */}
        <div className="flex items-center gap-4 mb-6">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center border border-slate-200', accentBg)}>
            <Icon className={cn('w-7 h-7', accentColor)} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{moduleName}</h1>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {phase}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">/{route}</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4 shadow-[var(--shadow-card)]">
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>

        {/* Planned features */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Planned for {phase}
          </p>
          <ul className="space-y-2">
            {plannedFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" aria-hidden="true" />
                <span className="text-sm text-slate-600">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Foundation note */}
        <p className="text-xs text-slate-400 text-center mt-5 italic">
          Phase 0 has established the routes, types, and design system this module will use.
        </p>
      </div>
    </div>
  )
}
