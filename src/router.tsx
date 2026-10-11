/**
 * Application router — Phase 0, Phase 1, and Phase 2 route definitions.
 *
 * - Operator Console routes under `/` with AppLayout
 * - Customer Scan & Go routes under `/shop` with CustomerLayout and CustomerCartProvider
 */
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { OverviewPage } from '@/pages/OverviewPage'
import { SessionsPage } from '@/pages/SessionsPage'
import { CartTwinPage } from '@/pages/CartTwinPage'
import { TimelinePage } from '@/pages/TimelinePage'
import { VerificationPage } from '@/pages/VerificationPage'
import { VisionPage } from '@/pages/VisionPage'
import { ExitVerificationPage } from '@/pages/ExitVerificationPage'
import { SettingsPage } from '@/pages/SettingsPage'

// Customer Scan & Go Phase 2 imports
import { CustomerCartProvider } from '@/context/CustomerCartContext'
import { CustomerLayout } from '@/components/customer/CustomerLayout'
import { ShopEntryPage } from '@/pages/customer/ShopEntryPage'
import { ScannerPage } from '@/pages/customer/ScannerPage'
import { CustomerCartPage } from '@/pages/customer/CustomerCartPage'
import { CustomerCheckoutPage } from '@/pages/customer/CustomerCheckoutPage'

import { SimulatorEventsProvider } from '@/context/SimulatorEventsContext'

const router = createBrowserRouter([
  // ── Operator Console Routes ─────────────────────────────────
  {
    path: '/',
    element: (
      <SimulatorEventsProvider>
        <AppLayout />
      </SimulatorEventsProvider>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/overview" replace />,
      },
      {
        path: 'overview',
        element: <OverviewPage />,
      },
      {
        path: 'sessions',
        element: <SessionsPage />,
      },
      {
        path: 'cart-twin',
        element: <CartTwinPage />,
      },
      {
        path: 'timeline',
        element: <TimelinePage />,
      },
      {
        path: 'verification',
        element: <VerificationPage />,
      },
      {
        path: 'vision',
        element: <VisionPage />,
      },
      {
        path: 'exit-verification',
        element: <ExitVerificationPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },

  // ── Customer Scan & Go Experience Routes (Phase 2) ──────────
  {
    path: '/shop',
    element: (
      <CustomerCartProvider>
        <CustomerLayout />
      </CustomerCartProvider>
    ),
    children: [
      {
        index: true,
        element: <ShopEntryPage />,
      },
      {
        path: 'scan',
        element: <ScannerPage />,
      },
      {
        path: 'cart',
        element: <CustomerCartPage />,
      },
      {
        path: 'checkout',
        element: <CustomerCheckoutPage />,
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
