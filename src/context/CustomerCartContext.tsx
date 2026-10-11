/**
 * CustomerCartContext — Phase 2 & Phase 4 Customer Scan & Go Context.
 *
 * Refactored in Phase 4 to delegate directly to the centralized
 * ReconciliationEngine (ReconciliationContext), ensuring the customer cart
 * and operator console always share the exact same active session state.
 */
import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import { PRODUCTS } from '@/data/demo'
import type { Product, ExitVerificationState, ExitPass } from '@/types/domain'
import { useReconciliation } from '@/context/ReconciliationContext'

export interface CustomerCartItem {
  product: Product
  quantity: number
  addedAt: string
  scanned: boolean
}

export type CustomerReconciliationState =
  | 'in_progress'        // Normal shopping, cart in sync
  | 'checking'           // Brief scan verification state
  | 'mismatch_review'    // Flagged for customer verification prompt
  | 'ready_to_checkout'  // Reconciled and clear for checkout

export interface CustomerDiscrepancy {
  product: Product
  reason: 'quantity_mismatch' | 'unconfirmed_shelf_event' | 'extra_item'
  message: string
  guidance: string
}

export interface CheckoutReceipt {
  receiptId: string
  sessionId: string
  cartLabel: string
  storeName: string
  completedAt: string
  items: CustomerCartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  exitCode: string
}

interface CustomerCartContextType {
  // Session details
  sessionId: string
  cartLabel: string
  storeName: string
  isSessionActive: boolean
  startSession: () => void

  // Cart state & actions
  items: CustomerCartItem[]
  addItem: (product: Product, quantity?: number) => void
  updateQuantity: (sku: string, quantity: number) => void
  removeItem: (sku: string) => void
  clearCart: () => void

  // Simulated Scanning
  simulateScan: (product: Product, triggerMismatch?: boolean) => { success: boolean; isMismatch: boolean }
  lastScannedProduct: Product | null

  // Reconciliation & Mismatch
  reconciliationState: CustomerReconciliationState
  activeDiscrepancy: CustomerDiscrepancy | null
  triggerDemoMismatch: (product?: Product) => void
  resolveMismatch: (action: 'confirm_item' | 'return_to_shelf' | 'rescan') => void
  dismissMismatchPrompt: () => void

  // Calculations
  itemCount: number
  subtotal: number
  tax: number
  total: number

  // Checkout & Exit Verification (Phase 5)
  checkoutReceipt: CheckoutReceipt | null
  completeCheckout: (paymentMethod?: string) => CheckoutReceipt
  startNewTrip: () => void
  exitState: ExitVerificationState
  exitPass: ExitPass | null
  hasRequestedExit: boolean
  isSessionCompleted: boolean
  requestExitVerification: () => { success: boolean; state: ExitVerificationState; reason?: string }
  confirmAndIssueExitPass: (paymentMethod?: string) => { success: boolean; pass: ExitPass | null; message?: string }
  completeExitJourney: () => { success: boolean; message: string }
}

const CustomerCartContext = createContext<CustomerCartContextType | undefined>(undefined)

export function CustomerCartProvider({ children }: { children: ReactNode }) {
  const {
    activeSessionId,
    activeCartLabel,
    activeStoreName,
    isSessionActive,
    digitalItems,
    digitalTotal,
    digitalItemCount,
    tax,
    grandTotal,
    reconciliationStatus,
    discrepancies,
    checkoutReceipt: sharedReceipt,
    processCustomerScan,
    processCustomerUpdateQuantity,
    processCustomerRemoveItem,
    processCustomerClearCart,
    processSimulatorInteraction,
    resolveDiscrepancy,
    completeActiveCheckout,
    resetInteractiveSession,
    exitState,
    exitPass,
    hasRequestedExit,
    isSessionCompleted,
    requestExitVerification,
    confirmAndIssueExitPass,
    completeExitJourney,
  } = useReconciliation()

  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null)
  const [isCheckingBriefly, setIsCheckingBriefly] = useState<boolean>(false)
  const [localDismissed, setLocalDismissed] = useState<boolean>(false)

  // Items mapped from shared digitalItems
  const items: CustomerCartItem[] = useMemo(() => {
    return digitalItems.map((i) => ({
      product: i.product,
      quantity: i.quantity,
      addedAt: i.addedAt,
      scanned: true,
    }))
  }, [digitalItems])

  // Active Discrepancy derived from engine
  const activeDiscrepancy: CustomerDiscrepancy | null = useMemo(() => {
    if (discrepancies.length === 0 || localDismissed) return null
    const first = discrepancies[0]
    const prod = Object.values(PRODUCTS).find((p) => p.sku === first.sku) || PRODUCTS.EGGS
    return {
      product: prod,
      reason:
        first.code === 'PICK_NOT_SCANNED'
          ? 'unconfirmed_shelf_event'
          : first.code === 'QUANTITY_MISMATCH'
            ? 'quantity_mismatch'
            : 'extra_item',
      message: "Let's double-check this item.",
      guidance:
        first.guidance ||
        `We couldn't confirm a match between your scanned product and observed telemetry for ${prod.name}.`,
    }
  }, [discrepancies, localDismissed])

  // Reconciliation state mapped from engine
  const reconciliationState: CustomerReconciliationState = useMemo(() => {
    if (isCheckingBriefly) return 'checking'
    if (activeDiscrepancy) return 'mismatch_review'
    if (reconciliationStatus === 'MISMATCH' || reconciliationStatus === 'UNCERTAIN') {
      return 'mismatch_review'
    }
    if (items.length > 0 && reconciliationStatus === 'MATCH') {
      return 'ready_to_checkout'
    }
    return 'in_progress'
  }, [isCheckingBriefly, activeDiscrepancy, reconciliationStatus, items.length])

  // Actions
  const addItem = (product: Product, quantity = 1) => {
    setLastScannedProduct(product)
    setLocalDismissed(false)
    processCustomerScan(product, quantity)
  }

  const updateQuantity = (sku: string, quantity: number) => {
    processCustomerUpdateQuantity(sku, quantity)
  }

  const removeItem = (sku: string) => {
    processCustomerRemoveItem(sku)
  }

  const clearCart = () => {
    processCustomerClearCart()
  }

  const simulateScan = (product: Product, triggerMismatch = false) => {
    setLastScannedProduct(product)
    setLocalDismissed(false)

    if (triggerMismatch) {
      // Simulate adding scanned item while physical sensor detects a DIFFERENT item
      processCustomerScan(product, 1)
      processSimulatorInteraction({
        productSku: PRODUCTS.CHEESE.sku,
        interactionType: 'PICK',
        confidence: 88,
        shelfZoneId: 'zone-dairy',
        slotPosition: 'C1',
        scenarioNote: `Shopper scanned ${product.name} but picked ${PRODUCTS.CHEESE.name}`,
      })
      return { success: true, isMismatch: true }
    }

    processCustomerScan(product, 1)
    setIsCheckingBriefly(true)
    setTimeout(() => {
      setIsCheckingBriefly(false)
    }, 500)

    return { success: true, isMismatch: false }
  }

  const triggerDemoMismatch = (product?: Product) => {
    const targetProduct = product || items[0]?.product || PRODUCTS.EGGS
    setLocalDismissed(false)
    processSimulatorInteraction({
      productSku: targetProduct.sku,
      interactionType: 'PICK',
      confidence: 85,
      shelfZoneId: 'zone-dairy',
      slotPosition: 'A2',
      scenarioNote: `Evaluation trigger: unscanned physical pick for ${targetProduct.name}`,
    })
  }

  const resolveMismatch = (action: 'confirm_item' | 'return_to_shelf' | 'rescan') => {
    if (!activeDiscrepancy) return
    const sku = activeDiscrepancy.product.sku

    if (action === 'return_to_shelf') {
      resolveDiscrepancy({ action: 'confirm_return', sku })
    } else {
      resolveDiscrepancy({ action: 'scan_item', sku })
    }
    setLocalDismissed(true)
  }

  const dismissMismatchPrompt = () => {
    setLocalDismissed(true)
  }

  const startSession = () => {
    resetInteractiveSession()
  }

  const startNewTrip = () => {
    resetInteractiveSession()
    setLocalDismissed(false)
  }

  const completeCheckout = (paymentMethod = 'Apple Pay (Demo)'): CheckoutReceipt => {
    const receiptData = completeActiveCheckout(paymentMethod)
    return {
      receiptId: receiptData.receiptId,
      sessionId: receiptData.sessionId,
      cartLabel: receiptData.cartLabel,
      storeName: receiptData.storeName,
      completedAt: receiptData.completedAt,
      items: receiptData.items.map((i) => ({
        product: i.product,
        quantity: i.quantity,
        addedAt: i.addedAt,
        scanned: true,
      })),
      subtotal: receiptData.subtotal,
      tax: receiptData.tax,
      total: receiptData.total,
      paymentMethod: receiptData.paymentMethod,
      exitCode: receiptData.exitCode,
    }
  }

  const checkoutReceipt: CheckoutReceipt | null = useMemo(() => {
    if (!sharedReceipt) return null
    return {
      receiptId: sharedReceipt.receiptId,
      sessionId: sharedReceipt.sessionId,
      cartLabel: sharedReceipt.cartLabel,
      storeName: sharedReceipt.storeName,
      completedAt: sharedReceipt.completedAt,
      items: sharedReceipt.items.map((i) => ({
        product: i.product,
        quantity: i.quantity,
        addedAt: i.addedAt,
        scanned: true,
      })),
      subtotal: sharedReceipt.subtotal,
      tax: sharedReceipt.tax,
      total: sharedReceipt.total,
      paymentMethod: sharedReceipt.paymentMethod,
      exitCode: sharedReceipt.exitCode,
    }
  }, [sharedReceipt])

  return (
    <CustomerCartContext.Provider
      value={{
        sessionId: activeSessionId,
        cartLabel: activeCartLabel,
        storeName: activeStoreName,
        isSessionActive,
        startSession,
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        simulateScan,
        lastScannedProduct,
        reconciliationState,
        activeDiscrepancy,
        triggerDemoMismatch,
        resolveMismatch,
        dismissMismatchPrompt,
        itemCount: digitalItemCount,
        subtotal: digitalTotal,
        tax,
        total: grandTotal,
        checkoutReceipt,
        completeCheckout,
        startNewTrip,
        exitState,
        exitPass,
        hasRequestedExit,
        isSessionCompleted,
        requestExitVerification,
        confirmAndIssueExitPass,
        completeExitJourney,
      }}
    >
      {children}
    </CustomerCartContext.Provider>
  )
}

export function useCustomerCart() {
  const context = useContext(CustomerCartContext)
  if (!context) {
    throw new Error('useCustomerCart must be used within a CustomerCartProvider')
  }
  return context
}
