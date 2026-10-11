/**
 * AppLayout — the shared application shell.
 * Wraps all pages with Sidebar + TopBar.
 */
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main content area ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          isSidebarOpen={sidebarOpen}
        />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          aria-label="Page content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
