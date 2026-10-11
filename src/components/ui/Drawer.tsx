/**
 * Drawer — a right-side slide-in panel for detail views.
 * Used for session details, verification case details, etc.
 */
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  width?: 'md' | 'lg' | 'xl'
}

const widthMap = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Drawer({ isOpen, onClose, title, subtitle, children, width = 'lg' }: DrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-xs transition-opacity duration-200',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full bg-white shadow-2xl border-l border-slate-200',
          'flex flex-col transition-transform duration-200 ease-out',
          widthMap[width],
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight truncate">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 active:scale-95"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}
