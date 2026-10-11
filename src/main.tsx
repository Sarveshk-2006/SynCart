import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRouter } from './router'
import { ReconciliationProvider } from '@/context/ReconciliationContext'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root not found in document. Check index.html.')
}

createRoot(container).render(
  <StrictMode>
    <ReconciliationProvider>
      <AppRouter />
    </ReconciliationProvider>
  </StrictMode>,
)
