/**
 * ReconciliationContext — Phase 4 Shared Session State & Deterministic Reconciliation Engine
 *
 * Implements:
 * 1. Centralized client-side state for active interactive session (sess-001 / Cart #A7F3).
 * 2. Deterministic reconciliation comparing Digital Cart (scans) vs Physical Cart (picks/returns/swaps).
 * 3. Idempotent event processing with processed event tracking.
 * 4. Distinct handling of low-confidence observations (UNCERTAIN) vs confirmed physical quantities.
 * 5. Dynamic verification case generation and resolution updates.
 * 6. Audit event logging in operator timeline.
 * 7. Predictable demo state reset.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react'
import {
  PRODUCTS,
  DEMO_SESSIONS,
  DEMO_EVENTS,
  DEMO_VERIFICATION_CASES,
  DEMO_SHELF_ZONES,
} from '@/data/demo'
import type {
  Product,
  CartItem,
  PhysicalInteraction,
  ShoppingSession,
  ShoppingEvent,
  VerificationCase,
  ShelfZone,
  ReconciliationStatus,
  DiscrepancyCode,
  ReconciliationDiscrepancy,
  UncertainObservation,
  ReconciledItem,
  ActiveSessionReconciliation,
  SimulatedVisionEvent,
  SimulatedInteractionType,
  ExitVerificationState,
  ExitPass,
} from '@/types/domain'

export const ACTIVE_SESSION_ID = 'sess-001'
export const ACTIVE_CART_LABEL = 'Cart #A7F3'
export const ACTIVE_SHOPPER_LABEL = 'Cart #A7F3'
export const ACTIVE_STORE_NAME = 'Greenfield Market'
export const CONFIDENCE_THRESHOLD = 70 // Confidence % required for confirmed physical pickup

// Initial baseline items for sess-001: perfectly matched at start
const INITIAL_BASELINE_PRODUCTS: { product: Product; quantity: number; confidence: number }[] = [
  { product: PRODUCTS.MILK, quantity: 1, confidence: 94 },
  { product: PRODUCTS.BREAD, quantity: 1, confidence: 96 },
  { product: PRODUCTS.APPLES, quantity: 1, confidence: 92 },
]

export interface ResolutionActionParams {
  action: 'scan_item' | 'confirm_return' | 'correct_sku' | 'operator_verify' | 'dismiss_uncertain'
  sku: string
  replacementSku?: string
  note?: string
}

interface ReconciliationContextType {
  // Session Identity
  activeSessionId: string
  activeCartLabel: string
  activeShopperLabel: string
  activeStoreName: string

  // Session Data & Status
  activeSession: ShoppingSession
  allSessions: ShoppingSession[]
  isSessionActive: boolean
  isCheckoutCompleted: boolean
  checkoutReceipt: CheckoutReceiptData | null

  // Live Cart State
  digitalItems: CartItem[]
  physicalItems: PhysicalInteraction[]
  uncertainObservations: UncertainObservation[]

  // Live Reconciliation Engine Output
  reconciliation: ActiveSessionReconciliation
  reconciliationStatus: ReconciliationStatus
  discrepancies: ReconciliationDiscrepancy[]
  reconciledRows: ReconciledItem[]

  // Calculations
  digitalTotal: number
  digitalItemCount: number
  physicalTotal: number
  physicalItemCount: number
  tax: number
  grandTotal: number

  // Event Stream (Live + Historical)
  allEvents: ShoppingEvent[]
  processedEventIds: string[]

  // Shelf Zones & Live Stock
  shelfZones: ShelfZone[]

  // Verification Queue
  allVerificationCases: VerificationCase[]

  // Engine Actions
  processCustomerScan: (product: Product, quantity?: number) => { success: boolean; eventId: string }
  processCustomerUpdateQuantity: (sku: string, quantity: number) => void
  processCustomerRemoveItem: (sku: string) => void
  processCustomerClearCart: () => void

  processSimulatorInteraction: (params: {
    productSku: string
    interactionType: SimulatedInteractionType
    confidence: number
    shelfZoneId?: string
    slotPosition?: string
    swapProductSku?: string
    scenarioNote?: string
  }) => { success: boolean; event?: SimulatedVisionEvent; message?: string }

  resolveDiscrepancy: (params: ResolutionActionParams) => { success: boolean; message: string }
  completeActiveCheckout: (paymentMethod?: string) => CheckoutReceiptData
  resetInteractiveSession: () => void

  // Exit Verification State Machine (Phase 5)
  exitState: ExitVerificationState
  exitPass: ExitPass | null
  hasRequestedExit: boolean
  isSessionCompleted: boolean
  requestExitVerification: () => { success: boolean; state: ExitVerificationState; reason?: string }
  confirmAndIssueExitPass: (paymentMethod?: string) => { success: boolean; pass: ExitPass | null; message?: string }
  completeExitJourney: () => { success: boolean; message: string }
  invalidateExitClearance: (reason?: string) => void
}

export interface CheckoutReceiptData {
  receiptId: string
  sessionId: string
  cartLabel: string
  storeName: string
  completedAt: string
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  exitCode: string
}

const ReconciliationContext = createContext<ReconciliationContextType | undefined>(undefined)

const STORAGE_KEY = 'syncart_active_session_state_v1'

interface SavedSessionState {
  digitalItems: CartItem[]
  physicalItems: PhysicalInteraction[]
  uncertainObservations: UncertainObservation[]
  liveEvents: ShoppingEvent[]
  processedEventIds: string[]
  shelfZones: ShelfZone[]
  liveVerificationCases: VerificationCase[]
  isCheckoutCompleted: boolean
  checkoutReceipt: CheckoutReceiptData | null
  exitPass: ExitPass | null
  hasRequestedExit: boolean
  isSessionCompleted: boolean
}

function loadInitialSavedState(): SavedSessionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore parse error
  }
  return null
}

export function ReconciliationProvider({ children }: { children: ReactNode }) {
  const saved = useMemo(() => loadInitialSavedState(), [])

  // ── 1. Digital Cart State ───────────────────────────────────────────
  const [digitalItems, setDigitalItems] = useState<CartItem[]>(() =>
    saved?.digitalItems && saved.digitalItems.length >= 0
      ? saved.digitalItems
      : INITIAL_BASELINE_PRODUCTS.map((p) => ({
          product: p.product,
          quantity: p.quantity,
          addedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        })),
  )

  // ── 2. Physical Cart State (Confirmed) ──────────────────────────────
  const [physicalItems, setPhysicalItems] = useState<PhysicalInteraction[]>(() =>
    saved?.physicalItems && saved.physicalItems.length >= 0
      ? saved.physicalItems
      : INITIAL_BASELINE_PRODUCTS.map((p) => ({
          product: p.product,
          quantity: p.quantity,
          detectedAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
          matched: true,
          observationConfidence: p.confidence,
          sourceLabel: 'Shelf Optical + Weight Telemetry',
        })),
  )

  // ── 3. Uncertain Physical Observations (< 70% confidence) ───────────
  const [uncertainObservations, setUncertainObservations] = useState<UncertainObservation[]>(
    () => saved?.uncertainObservations || [],
  )

  // ── 4. Processed Events History (Live audit log) ────────────────────
  const [liveEvents, setLiveEvents] = useState<ShoppingEvent[]>(() => saved?.liveEvents || [])
  const [processedEventIds, setProcessedEventIds] = useState<Set<string>>(
    () => new Set(saved?.processedEventIds || []),
  )

  // ── 5. Dynamic Shelf Zones ──────────────────────────────────────────
  const [shelfZones, setShelfZones] = useState<ShelfZone[]>(() => saved?.shelfZones || DEMO_SHELF_ZONES)

  // ── 6. Verification Cases (Merged with historical) ──────────────────
  const [liveVerificationCases, setLiveVerificationCases] = useState<VerificationCase[]>(
    () => saved?.liveVerificationCases || [],
  )

  // ── 7. Checkout & Exit Verification Status (Phase 5) ───────────────
  const [isCheckoutCompleted, setIsCheckoutCompleted] = useState<boolean>(() =>
    Boolean(saved?.isCheckoutCompleted),
  )
  const [checkoutReceipt, setCheckoutReceipt] = useState<CheckoutReceiptData | null>(
    () => saved?.checkoutReceipt || null,
  )
  const [hasRequestedExit, setHasRequestedExit] = useState<boolean>(() =>
    Boolean(saved?.hasRequestedExit),
  )
  const [isSessionCompleted, setIsSessionCompleted] = useState<boolean>(() =>
    Boolean(saved?.isSessionCompleted),
  )
  const [exitPass, setExitPass] = useState<ExitPass | null>(() => saved?.exitPass || null)

  // Auto-sync active state to sessionStorage for seamless full-page URL navigations
  useEffect(() => {
    try {
      const payload: SavedSessionState = {
        digitalItems,
        physicalItems,
        uncertainObservations,
        liveEvents,
        processedEventIds: Array.from(processedEventIds),
        shelfZones,
        liveVerificationCases,
        isCheckoutCompleted,
        checkoutReceipt,
        exitPass,
        hasRequestedExit,
        isSessionCompleted,
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore storage errors
    }
  }, [
    digitalItems,
    physicalItems,
    uncertainObservations,
    liveEvents,
    processedEventIds,
    shelfZones,
    liveVerificationCases,
    isCheckoutCompleted,
    checkoutReceipt,
    exitPass,
    hasRequestedExit,
    isSessionCompleted,
  ])

  // ── Totals & Calculations ───────────────────────────────────────────
  const digitalSubtotal = useMemo(() => {
    return digitalItems.reduce((acc, i) => acc + i.product.priceUsd * i.quantity, 0)
  }, [digitalItems])

  const digitalItemCount = useMemo(() => {
    return digitalItems.reduce((acc, i) => acc + i.quantity, 0)
  }, [digitalItems])

  const physicalSubtotal = useMemo(() => {
    return physicalItems.reduce((acc, i) => acc + i.product.priceUsd * i.quantity, 0)
  }, [physicalItems])

  const physicalItemCount = useMemo(() => {
    return physicalItems.reduce((acc, i) => acc + i.quantity, 0)
  }, [physicalItems])

  const tax = useMemo(() => {
    return Math.round(digitalSubtotal * 0.05 * 100) / 100
  }, [digitalSubtotal])

  const grandTotal = useMemo(() => {
    return Math.round((digitalSubtotal + tax) * 100) / 100
  }, [digitalSubtotal, tax])

  // ── 8. DETERMINISTIC RECONCILIATION ENGINE ──────────────────────────
  const reconciliation = useMemo<ActiveSessionReconciliation>(() => {
    const digitalMap = new Map<string, { product: Product; qty: number }>()
    digitalItems.forEach((item) => {
      const prev = digitalMap.get(item.product.sku)?.qty || 0
      digitalMap.set(item.product.sku, { product: item.product, qty: prev + item.quantity })
    })

    const physicalMap = new Map<string, { product: Product; qty: number; conf: number }>()
    physicalItems.forEach((item) => {
      const prev = physicalMap.get(item.product.sku)?.qty || 0
      physicalMap.set(item.product.sku, {
        product: item.product,
        qty: prev + item.quantity,
        conf: item.observationConfidence || 90,
      })
    })

    const allSkus = new Set([...digitalMap.keys(), ...physicalMap.keys()])
    const matchedRows: ReconciledItem[] = []
    const discrepancies: ReconciliationDiscrepancy[] = []

    allSkus.forEach((sku) => {
      const dItem = digitalMap.get(sku)
      const pItem = physicalMap.get(sku)
      const product = dItem?.product || pItem?.product
      if (!product) return

      const dQty = dItem?.qty || 0
      const pQty = pItem?.qty || 0

      if (dQty === pQty && dQty > 0) {
        matchedRows.push({
          product,
          digitalQty: dQty,
          physicalQty: pQty,
          matchStatus: 'matched',
        })
      } else if (pQty > dQty) {
        // Physical pick without matching scan
        const code: DiscrepancyCode = dQty === 0 ? 'PICK_NOT_SCANNED' : 'QUANTITY_MISMATCH'
        discrepancies.push({
          sku,
          productName: product.name,
          reason: dQty === 0 ? 'unscanned_item' : 'quantity_discrepancy',
          code,
          digitalQty: dQty,
          physicalQty: pQty,
          status: 'active',
          description:
            dQty === 0
              ? `Physical shelf sensor detected ${pQty} unit(s) of ${product.name} in cart, but no corresponding barcode scan was recorded.`
              : `Cart recorded ${dQty} unit(s) scanned, but physical shelf telemetry confirmed ${pQty} units picked.`,
          guidance: `Scan ${product.name} using the customer scanner or verify if item was returned to shelf.`,
          resolution: 'Scan unscanned item or return to shelf.',
        })

        matchedRows.push({
          product,
          digitalQty: dQty,
          physicalQty: pQty,
          matchStatus: 'unscanned_pick',
          discrepancyCode: code,
        })
      } else if (dQty > pQty) {
        // Customer scanned, but physical pick unconfirmed
        const code: DiscrepancyCode = pQty === 0 ? 'SCAN_PICK_UNCONFIRMED' : 'QUANTITY_MISMATCH'
        discrepancies.push({
          sku,
          productName: product.name,
          reason: pQty === 0 ? 'extra_item_in_cart' : 'quantity_discrepancy',
          code,
          digitalQty: dQty,
          physicalQty: pQty,
          status: 'active',
          description:
            pQty === 0
              ? `Customer scanned ${dQty} unit(s) of ${product.name}, but shelf interaction has not confirmed physical pickup.`
              : `Customer scanned ${dQty} unit(s), but only ${pQty} unit(s) confirmed on shelf.`,
          guidance: `Verify whether item was placed in cart or left at shelf location.`,
          resolution: 'Confirm item physical presence or remove from cart.',
        })

        matchedRows.push({
          product,
          digitalQty: dQty,
          physicalQty: pQty,
          matchStatus: 'unconfirmed_scan',
          discrepancyCode: code,
        })
      }
    })

    // Include low-confidence uncertain observations
    uncertainObservations.forEach((obs) => {
      discrepancies.push({
        sku: obs.product.sku,
        productName: obs.product.name,
        reason: 'extra_item_in_cart',
        code: 'LOW_CONFIDENCE',
        digitalQty: 0,
        physicalQty: 0,
        uncertainQty: obs.quantity,
        status: 'active',
        description: `Uncertain shelf observation (${obs.confidence}% confidence < 70% threshold). Telemetry obstructed at ${obs.shelfZoneLabel}.`,
        guidance: `Requires operator review before treating as confirmed cart addition.`,
        resolution: 'Inspect video telemetry or verify cart physically.',
      })

      matchedRows.push({
        product: obs.product,
        digitalQty: 0,
        physicalQty: 0,
        uncertainQty: obs.quantity,
        matchStatus: 'uncertain',
        discrepancyCode: 'LOW_CONFIDENCE',
      })
    })

    // Overall state determination
    let overallState: ReconciliationStatus = 'MATCH'
    const nonUncertainDiscrepancies = discrepancies.filter((d) => d.code !== 'LOW_CONFIDENCE')
    const lowConfDiscrepancies = discrepancies.filter((d) => d.code === 'LOW_CONFIDENCE')

    if (nonUncertainDiscrepancies.length > 0) {
      overallState = 'MISMATCH'
    } else if (lowConfDiscrepancies.length > 0) {
      overallState = 'UNCERTAIN'
    } else {
      overallState = 'MATCH'
    }

    return {
      sessionId: ACTIVE_SESSION_ID,
      overallState,
      matchedItems: matchedRows,
      discrepancies,
      uncertainObservations,
      digitalTotal: Math.round(digitalSubtotal * 100) / 100,
      physicalTotal: Math.round(physicalSubtotal * 100) / 100,
      digitalItemCount,
      physicalItemCount,
      lastReconciledAt: new Date().toISOString(),
    }
  }, [digitalItems, physicalItems, uncertainObservations, digitalSubtotal, physicalSubtotal, digitalItemCount, physicalItemCount])

  // ── 8B. EXIT VERIFICATION STATE MACHINE (Phase 5) ───────────────────
  const exitState = useMemo<ExitVerificationState>(() => {
    if (isSessionCompleted) {
      return 'COMPLETED'
    }
    const hasDiscrepancy =
      reconciliation.overallState !== 'MATCH' || reconciliation.discrepancies.length > 0

    if (hasDiscrepancy) {
      // Any unresolved discrepancy or uncertain observation blocks clearance
      return hasRequestedExit ? 'BLOCKED' : 'NOT_REQUESTED'
    }

    // Clean MATCH
    if (exitPass) {
      return 'VERIFIED'
    }
    if (hasRequestedExit) {
      return 'READY'
    }
    return 'NOT_REQUESTED'
  }, [
    isSessionCompleted,
    reconciliation.overallState,
    reconciliation.discrepancies.length,
    hasRequestedExit,
    exitPass,
  ])

  // Derive active session model dynamically
  const activeSession = useMemo<ShoppingSession>(() => {
    let status: ShoppingSession['status'] = 'active'
    if (isSessionCompleted || isCheckoutCompleted) {
      status = 'exited'
    } else if (reconciliation.overallState === 'MISMATCH') {
      status = 'mismatch'
    } else if (reconciliation.overallState === 'UNCERTAIN') {
      status = 'reconciling'
    } else {
      status = 'reconciled'
    }

    return {
      id: ACTIVE_SESSION_ID,
      cartId: 'cart-a7f3',
      shopperLabel: ACTIVE_SHOPPER_LABEL,
      status,
      startedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      lastActivityAt: new Date().toISOString(),
      itemCount: digitalItemCount,
      physicalItemCount: physicalItemCount,
      estimatedTotal: digitalSubtotal,
      mismatchCount: reconciliation.discrepancies.length,
    }
  }, [reconciliation, isSessionCompleted, isCheckoutCompleted, digitalItemCount, physicalItemCount, digitalSubtotal])

  // All sessions combining live active session with historical fixtures
  const allSessions = useMemo<ShoppingSession[]>(() => {
    return DEMO_SESSIONS.map((s) => (s.id === ACTIVE_SESSION_ID ? activeSession : s))
  }, [activeSession])

  // All events combining live session stream with historical fixtures
  const allEvents = useMemo<ShoppingEvent[]>(() => {
    return [...liveEvents, ...DEMO_EVENTS]
  }, [liveEvents])

  // All verification cases combining live active session cases with historical
  const allVerificationCases = useMemo<VerificationCase[]>(() => {
    // Generate active cases for current discrepancies if not already present
    const generatedActiveCases: VerificationCase[] = reconciliation.discrepancies.map((d, index) => {
      const existing = liveVerificationCases.find(
        (c) => c.sessionId === ACTIVE_SESSION_ID && c.affectedSku === d.sku,
      )
      if (existing) return existing

      const isLowConf = d.code === 'LOW_CONFIDENCE'
      return {
        id: `case-live-${d.sku}-${index}`,
        sessionId: ACTIVE_SESSION_ID,
        shopperLabel: ACTIVE_SHOPPER_LABEL,
        mismatchReason: d.reason,
        confidence: isLowConf ? 'low' : 'high',
        confidenceScore: isLowConf ? 45 : 92,
        status: 'pending',
        createdAt: new Date().toISOString(),
        description: d.description,
        priority: isLowConf ? 'medium' : 'high',
        affectedSku: d.sku,
        affectedProductName: d.productName,
        evidence: `Digital Qty: ${d.digitalQty} | Physical Qty: ${d.physicalQty}. Code: ${d.code}`,
        digitalQty: d.digitalQty,
        physicalQty: d.physicalQty,
      }
    })

    // Retain manually updated live cases (e.g., resolved or in_review)
    const combinedLiveCases = [
      ...liveVerificationCases,
      ...generatedActiveCases.filter(
        (gen) => !liveVerificationCases.some((l) => l.affectedSku === gen.affectedSku),
      ),
    ]

    return [
      ...combinedLiveCases,
      ...DEMO_VERIFICATION_CASES.filter((c) => c.sessionId !== ACTIVE_SESSION_ID),
    ]
  }, [reconciliation.discrepancies, liveVerificationCases])

  // ── Helper: Record and Log Auditable Event ───────────────────────────
  const logEvent = useCallback((event: ShoppingEvent) => {
    setProcessedEventIds((prev) => new Set(prev).add(event.id))
    setLiveEvents((prev) => [event, ...prev])
  }, [])

  // ── Helper: Invalidate Exit Clearance on Post-Verification Modifications (Rule 7)
  const invalidateExitClearance = useCallback(
    (reason = 'Cart modified after verification') => {
      setExitPass((prev) => {
        if (!prev) return null
        logEvent({
          id: `inv-pass-${Date.now().toString().slice(-6)}`,
          sessionId: ACTIVE_SESSION_ID,
          type: 'exit_clearance_invalidated',
          description: `Exit clearance pass invalidated: ${reason}. Verification must be re-run before exit.`,
          occurredAt: new Date().toISOString(),
          severity: 'warning',
          locationLabel: 'Self-Checkout Exit Gate',
          isSimulatedSource: false,
        })
        return null
      })
    },
    [logEvent],
  )

  // ── 9. CUSTOMER APP EVENT HANDLERS ──────────────────────────────────
  const processCustomerScan = useCallback(
    (product: Product, quantity = 1) => {
      if (isSessionCompleted) {
        return { success: false, eventId: '' }
      }
      if (exitPass) {
        invalidateExitClearance(`Customer scanned new item (${product.name})`)
      }

      const eventId = `scan-${product.sku}-${Date.now().toString().slice(-6)}`

      // Idempotency check
      if (processedEventIds.has(eventId)) {
        return { success: false, eventId }
      }

      setDigitalItems((prev) => {
        const existing = prev.find((i) => i.product.sku === product.sku)
        if (existing) {
          return prev.map((i) =>
            i.product.sku === product.sku ? { ...i, quantity: i.quantity + quantity } : i,
          )
        }
        return [
          ...prev,
          {
            product,
            quantity,
            addedAt: new Date().toISOString(),
          },
        ]
      })

      logEvent({
        id: eventId,
        sessionId: ACTIVE_SESSION_ID,
        type: 'barcode_scanned',
        sku: product.sku,
        productName: product.name,
        description: `Customer scanned ${product.name} (SKU: ${product.sku}). Added to digital cart.`,
        occurredAt: new Date().toISOString(),
        severity: 'info',
        locationLabel: 'Customer Mobile Scanner',
        isSimulatedSource: false,
      })

      return { success: true, eventId }
    },
    [isSessionCompleted, exitPass, invalidateExitClearance, processedEventIds, logEvent],
  )

  const processCustomerRemoveItem = useCallback(
    (sku: string) => {
      if (isSessionCompleted) return
      if (exitPass) {
        invalidateExitClearance(`Customer removed SKU ${sku}`)
      }

      const targetItem = digitalItems.find((i) => i.product.sku === sku)
      setDigitalItems((prev) => prev.filter((i) => i.product.sku !== sku))

      logEvent({
        id: `remove-${sku}-${Date.now().toString().slice(-6)}`,
        sessionId: ACTIVE_SESSION_ID,
        type: 'barcode_scanned',
        sku,
        productName: targetItem?.product.name || sku,
        description: `Customer removed ${targetItem?.product.name || sku} from digital cart.`,
        occurredAt: new Date().toISOString(),
        severity: 'info',
        locationLabel: 'Customer Mobile Cart',
        isSimulatedSource: false,
      })
    },
    [isSessionCompleted, exitPass, invalidateExitClearance, digitalItems, logEvent],
  )

  const processCustomerUpdateQuantity = useCallback(
    (sku: string, quantity: number) => {
      if (isSessionCompleted) return
      if (exitPass) {
        invalidateExitClearance(`Customer updated quantity for SKU ${sku}`)
      }

      if (quantity <= 0) {
        processCustomerRemoveItem(sku)
        return
      }

      setDigitalItems((prev) =>
        prev.map((i) => (i.product.sku === sku ? { ...i, quantity } : i)),
      )

      const targetProduct = Object.values(PRODUCTS).find((p) => p.sku === sku)
      logEvent({
        id: `qty-update-${sku}-${Date.now().toString().slice(-6)}`,
        sessionId: ACTIVE_SESSION_ID,
        type: 'barcode_scanned',
        sku,
        productName: targetProduct?.name || sku,
        description: `Customer adjusted quantity for ${targetProduct?.name || sku} to ${quantity}.`,
        occurredAt: new Date().toISOString(),
        severity: 'info',
        locationLabel: 'Customer Mobile Cart',
        isSimulatedSource: false,
      })
    },
    [isSessionCompleted, exitPass, invalidateExitClearance, processCustomerRemoveItem, logEvent],
  )

  const processCustomerClearCart = useCallback(() => {
    if (isSessionCompleted) return
    if (exitPass) {
      invalidateExitClearance('Customer cleared digital cart')
    }

    setDigitalItems([])
    logEvent({
      id: `clear-cart-${Date.now().toString().slice(-6)}`,
      sessionId: ACTIVE_SESSION_ID,
      type: 'barcode_scanned',
      description: `Customer cleared digital cart.`,
      occurredAt: new Date().toISOString(),
      severity: 'warning',
      locationLabel: 'Customer Mobile Cart',
      isSimulatedSource: false,
    })
  }, [isSessionCompleted, exitPass, invalidateExitClearance, logEvent])

  // ── 10. SIMULATOR INTERACTION PROCESSOR ─────────────────────────────
  const processSimulatorInteraction = useCallback(
    (params: {
      productSku: string
      interactionType: SimulatedInteractionType
      confidence: number
      shelfZoneId?: string
      slotPosition?: string
      swapProductSku?: string
      scenarioNote?: string
    }) => {
      const {
        productSku,
        interactionType,
        confidence,
        shelfZoneId = 'zone-dairy',
        slotPosition = 'A1',
        swapProductSku,
        scenarioNote,
      } = params

      if (isSessionCompleted) {
        return { success: false, message: 'Session is completed. Start a new trip or reset demo to continue.' }
      }
      if (exitPass) {
        invalidateExitClearance(`Physical ${interactionType} interaction recorded`)
      }

      const product = Object.values(PRODUCTS).find((p) => p.sku === productSku) || PRODUCTS.EGGS
      const zone = shelfZones.find((z) => z.id === shelfZoneId) || shelfZones[0]
      const eventId = `sim-evt-${Date.now().toString().slice(-6)}`

      // Idempotency check
      if (processedEventIds.has(eventId)) {
        return { success: false, message: 'Event ID already processed' }
      }

      const slot = zone.products.find((p) => p.product.sku === productSku) || zone.products[0]
      const beforeStock = slot.currentStock
      let afterStock = beforeStock

      // Shelf stock delta
      if (interactionType === 'PICK') {
        afterStock = Math.max(0, beforeStock - 1)
      } else if (interactionType === 'RETURN') {
        afterStock = beforeStock + 1
      }

      // Update dynamic shelf zones
      setShelfZones((prev) =>
        prev.map((z) => {
          if (z.id !== zone.id) return z
          return {
            ...z,
            products: z.products.map((p) => {
              if (p.product.sku !== productSku) return p
              return {
                ...p,
                currentStock: afterStock,
                recentInteraction: {
                  type: interactionType.toLowerCase() as 'pick' | 'return' | 'move' | 'swap',
                  detectedAt: new Date().toISOString(),
                  confidence,
                },
              }
            }),
          }
        }),
      )

      // Handle interaction semantics
      if (interactionType === 'PICK') {
        if (confidence < CONFIDENCE_THRESHOLD) {
          // Low confidence: record as UNCERTAIN observation (does not inflate confirmed physical cart)
          const newUncertain: UncertainObservation = {
            id: `unc-${Date.now().toString().slice(-6)}`,
            product,
            quantity: 1,
            confidence,
            observedAt: new Date().toISOString(),
            shelfZoneLabel: `${zone.aisle} — ${zone.label} (${slotPosition})`,
            reason: `Optical detection below ${CONFIDENCE_THRESHOLD}% confidence threshold. Partial occlusion.`,
            eventId,
          }
          setUncertainObservations((prev) => [newUncertain, ...prev])
        } else {
          // Confirmed physical pick
          setPhysicalItems((prev) => {
            const existing = prev.find((i) => i.product.sku === product.sku)
            if (existing) {
              return prev.map((i) =>
                i.product.sku === product.sku
                  ? { ...i, quantity: i.quantity + 1, observationConfidence: confidence }
                  : i,
              )
            }
            return [
              ...prev,
              {
                product,
                quantity: 1,
                detectedAt: new Date().toISOString(),
                matched: false,
                observationConfidence: confidence,
                sourceLabel: `${zone.aisle} — ${zone.label} (${slotPosition})`,
              },
            ]
          })
        }
      } else if (interactionType === 'RETURN') {
        // Safe Return Check: Cannot return item not physically in cart
        const existingPhysical = physicalItems.find((i) => i.product.sku === product.sku)
        if (!existingPhysical || existingPhysical.quantity <= 0) {
          logEvent({
            id: `inv-ret-${Date.now().toString().slice(-6)}`,
            sessionId: ACTIVE_SESSION_ID,
            type: 'product_returned',
            sku: product.sku,
            productName: product.name,
            description: `[INVALID RETURN] Rejected return for ${product.name}: 0 units physically present in cart.`,
            occurredAt: new Date().toISOString(),
            severity: 'warning',
            locationLabel: `${zone.aisle} — ${zone.label}`,
            isSimulatedSource: true,
          })
          return {
            success: false,
            message: `INVALID_RETURN: Cannot return ${product.name} because it was never physically picked into this cart.`,
          }
        }

        // Reverse physical quantity
        setPhysicalItems((prev) =>
          prev
            .map((i) => (i.product.sku === product.sku ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0),
        )
      } else if (interactionType === 'SWAP') {
        // Swap: Replace SKU A with SKU B in physical cart
        const swapProduct =
          Object.values(PRODUCTS).find((p) => p.sku === swapProductSku) || PRODUCTS.CHEESE

        setPhysicalItems((prev) => {
          // Decrement original if present
          const decremented = prev
            .map((i) => (i.product.sku === product.sku ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0)

          // Add swapped SKU
          const existingSwap = decremented.find((i) => i.product.sku === swapProduct.sku)
          if (existingSwap) {
            return decremented.map((i) =>
              i.product.sku === swapProduct.sku ? { ...i, quantity: i.quantity + 1 } : i,
            )
          }
          return [
            ...decremented,
            {
              product: swapProduct,
              quantity: 1,
              detectedAt: new Date().toISOString(),
              matched: false,
              observationConfidence: confidence,
              sourceLabel: `${zone.aisle} — ${zone.label} (${slotPosition})`,
            },
          ]
        })
      }
      // Note: MOVE interaction updates shelf telemetry without modifying cart quantities

      const eventTypeMap: Record<SimulatedInteractionType, ShoppingEvent['type']> = {
        PICK: 'product_picked',
        RETURN: 'product_returned',
        MOVE: 'product_moved',
        SWAP: 'product_swapped',
      }

      const simEvent: SimulatedVisionEvent = {
        id: eventId,
        sessionId: ACTIVE_SESSION_ID,
        type: eventTypeMap[interactionType],
        interactionType,
        sku: product.sku,
        productName: product.name,
        shelfZoneId: zone.id,
        shelfZoneLabel: zone.label,
        aisle: zone.aisle,
        slotPosition,
        occurredAt: new Date().toISOString(),
        description: `[SIMULATED] ${product.name} ${interactionType.toLowerCase()} at ${zone.label} (${slotPosition}). Confidence: ${confidence}%`,
        severity: confidence < CONFIDENCE_THRESHOLD ? 'warning' : 'info',
        confidence,
        locationLabel: `${zone.aisle} — ${zone.label} (${slotPosition})`,
        isSimulatedSource: true,
        sourceLabel: 'Simulated Optical + Weight Sensor',
        beforeStock,
        afterStock,
        scenarioNote: scenarioNote || `Triggered in session ${ACTIVE_CART_LABEL}`,
      }

      logEvent(simEvent)
      return { success: true, event: simEvent }
    },
    [isSessionCompleted, exitPass, invalidateExitClearance, shelfZones, processedEventIds, physicalItems, logEvent],
  )

  // ── 11. EXPLICIT RESOLUTION ACTIONS ─────────────────────────────────
  const resolveDiscrepancy = useCallback(
    (params: ResolutionActionParams) => {
      if (isSessionCompleted) {
        return { success: false, message: 'Session is completed. Start a new trip or reset demo to continue.' }
      }
      if (exitPass) {
        invalidateExitClearance('Discrepancy resolution modified cart state')
      }

      const { action, sku, note } = params
      const targetProduct = Object.values(PRODUCTS).find((p) => p.sku === sku)
      if (!targetProduct) {
        return { success: false, message: `Unknown product SKU: ${sku}` }
      }

      const resEventId = `res-${sku}-${Date.now().toString().slice(-6)}`
      const nowIso = new Date().toISOString()

      if (action === 'scan_item') {
        // Customer or operator scanned the missing picked item
        processCustomerScan(targetProduct, 1)

        logEvent({
          id: resEventId,
          sessionId: ACTIVE_SESSION_ID,
          type: 'discrepancy_resolved',
          sku,
          productName: targetProduct.name,
          description: `Discrepancy resolved: Scanned missing item ${targetProduct.name}. Digital and physical carts now match.`,
          occurredAt: nowIso,
          severity: 'success',
          locationLabel: 'Resolution Console',
          isSimulatedSource: false,
        })
      } else if (action === 'confirm_return') {
        // Confirmed return to shelf: deduct from physical cart
        setPhysicalItems((prev) =>
          prev
            .map((i) => (i.product.sku === sku ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0),
        )

        // Restore shelf inventory
        setShelfZones((prev) =>
          prev.map((z) => ({
            ...z,
            products: z.products.map((p) =>
              p.product.sku === sku ? { ...p, currentStock: p.currentStock + 1 } : p,
            ),
          })),
        )

        logEvent({
          id: resEventId,
          sessionId: ACTIVE_SESSION_ID,
          type: 'discrepancy_resolved',
          sku,
          productName: targetProduct.name,
          description: `Discrepancy resolved: Confirmed return of ${targetProduct.name} to shelf. Physical cart decremented.`,
          occurredAt: nowIso,
          severity: 'success',
          locationLabel: 'Shelf Return Verification',
          isSimulatedSource: false,
        })
      } else if (action === 'correct_sku') {
        // Swap or wrong SKU replacement: adjust physical to match digital
        setPhysicalItems((prev) => {
          const filtered = prev.filter((i) => i.product.sku !== sku)
          return [
            ...filtered,
            {
              product: targetProduct,
              quantity: 1,
              detectedAt: nowIso,
              matched: true,
              observationConfidence: 95,
              sourceLabel: 'Corrected via Operator Reconciliation',
            },
          ]
        })

        logEvent({
          id: resEventId,
          sessionId: ACTIVE_SESSION_ID,
          type: 'discrepancy_resolved',
          sku,
          productName: targetProduct.name,
          description: `Discrepancy resolved: Corrected physical SKU to match digital scan (${targetProduct.name}).`,
          occurredAt: nowIso,
          severity: 'success',
          locationLabel: 'Operator Cart Twin Console',
          isSimulatedSource: false,
        })
      } else if (action === 'operator_verify') {
        // Operator verifies physical cart in person and clears discrepancy
        setPhysicalItems((prev) => {
          const existing = prev.find((i) => i.product.sku === sku)
          const targetDigital = digitalItems.find((i) => i.product.sku === sku)
          const qty = targetDigital?.quantity || 1

          if (existing) {
            return prev.map((i) => (i.product.sku === sku ? { ...i, quantity: qty, matched: true } : i))
          }
          return [
            ...prev,
            {
              product: targetProduct,
              quantity: qty,
              detectedAt: nowIso,
              matched: true,
              observationConfidence: 99,
              sourceLabel: 'Operator Manual Inspection Clearance',
            },
          ]
        })

        logEvent({
          id: resEventId,
          sessionId: ACTIVE_SESSION_ID,
          type: 'discrepancy_resolved',
          sku,
          productName: targetProduct.name,
          description: `Discrepancy resolved by Operator manual inspection: ${note || 'Cart visually verified'}.`,
          occurredAt: nowIso,
          severity: 'success',
          locationLabel: 'Verification Station',
          isSimulatedSource: false,
        })
      } else if (action === 'dismiss_uncertain') {
        // Operator dismisses low-confidence observation as false positive
        setUncertainObservations((prev) => prev.filter((o) => o.product.sku !== sku))

        logEvent({
          id: resEventId,
          sessionId: ACTIVE_SESSION_ID,
          type: 'discrepancy_resolved',
          sku,
          productName: targetProduct.name,
          description: `Uncertain observation dismissed: Operator verified item was not picked. Telemetry cleared.`,
          occurredAt: nowIso,
          severity: 'info',
          locationLabel: 'Verification Station',
          isSimulatedSource: false,
        })
      }

      // Update associated live verification case
      setLiveVerificationCases((prev) =>
        prev.map((c) => {
          if (c.sessionId === ACTIVE_SESSION_ID && c.affectedSku === sku) {
            return {
              ...c,
              status: 'resolved',
              resolvedAt: nowIso,
              description: `[RESOLVED] ${c.description} — Action: ${action} (${note || 'Auto-cleared'}).`,
            }
          }
          return c
        }),
      )

      return { success: true, message: `Successfully resolved discrepancy for ${targetProduct.name}.` }
    },
    [isSessionCompleted, exitPass, invalidateExitClearance, digitalItems, processCustomerScan, logEvent],
  )

  // ── 12. EXIT VERIFICATION LIFECYCLE (Phase 5) ───────────────────────
  const requestExitVerification = useCallback(() => {
    if (isSessionCompleted) {
      return {
        success: false,
        state: 'COMPLETED' as ExitVerificationState,
        reason: 'Session is already completed.',
      }
    }
    setHasRequestedExit(true)
    const nowIso = new Date().toISOString()
    const eventId = `exit-req-${Date.now().toString().slice(-6)}`
    logEvent({
      id: eventId,
      sessionId: ACTIVE_SESSION_ID,
      type: 'exit_verification_requested',
      description: `Customer requested exit verification for ${ACTIVE_CART_LABEL}. Comparing ${digitalItemCount} digital scans against ${physicalItemCount} physical items.`,
      occurredAt: nowIso,
      severity: 'info',
      locationLabel: 'Self-Checkout Lane 1',
      isSimulatedSource: false,
    })

    const isBlocked =
      reconciliation.overallState !== 'MATCH' || reconciliation.discrepancies.length > 0
    return {
      success: !isBlocked,
      state: isBlocked ? ('BLOCKED' as ExitVerificationState) : ('READY' as ExitVerificationState),
      reason: isBlocked
        ? 'Cart has discrepancies or uncertain observations preventing clearance.'
        : undefined,
    }
  }, [
    isSessionCompleted,
    reconciliation.overallState,
    reconciliation.discrepancies.length,
    digitalItemCount,
    physicalItemCount,
    logEvent,
  ])

  const confirmAndIssueExitPass = useCallback(
    (paymentMethod = 'Apple Pay (Demo)') => {
      if (isSessionCompleted) {
        return { success: false, pass: null, message: 'Session is already completed.' }
      }
      const isBlocked =
        reconciliation.overallState !== 'MATCH' || reconciliation.discrepancies.length > 0
      if (isBlocked) {
        return {
          success: false,
          pass: null,
          message:
            'Cannot issue exit pass while cart has unresolved discrepancies or uncertain observations.',
        }
      }
      // Rule 6: Idempotent - return existing pass if already issued
      if (exitPass) {
        return { success: true, pass: exitPass }
      }

      const nowIso = new Date().toISOString()
      const passId = `PASS-${Date.now().toString().slice(-6)}`
      const exitCode = `SYNCART-GATE-PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      const auditChecksum = `SHA256:${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`

      const newPass: ExitPass = {
        passId,
        sessionId: ACTIVE_SESSION_ID,
        cartLabel: ACTIVE_CART_LABEL,
        storeName: ACTIVE_STORE_NAME,
        issuedAt: nowIso,
        exitCode,
        itemCount: digitalItemCount,
        subtotal: digitalSubtotal,
        tax,
        total: grandTotal,
        paymentMethod,
        reconciliationStatus: 'MATCH',
        reconciledItemCount: digitalItemCount,
        items: [...digitalItems],
        auditChecksum,
        isSimulated: true,
      }

      setExitPass(newPass)
      setIsCheckoutCompleted(true)
      setCheckoutReceipt({
        receiptId: `REC-${passId.replace('PASS-', '')}`,
        sessionId: ACTIVE_SESSION_ID,
        cartLabel: ACTIVE_CART_LABEL,
        storeName: ACTIVE_STORE_NAME,
        completedAt: nowIso,
        items: [...digitalItems],
        subtotal: digitalSubtotal,
        tax,
        total: grandTotal,
        paymentMethod,
        exitCode,
      })

      logEvent({
        id: `pass-evt-${Date.now().toString().slice(-6)}`,
        sessionId: ACTIVE_SESSION_ID,
        type: 'exit_pass_issued',
        description: `Digital Exit Pass issued (${passId}) for ${ACTIVE_CART_LABEL}. Reconciliation 100% MATCH. Exit code: ${exitCode}.`,
        occurredAt: nowIso,
        severity: 'success',
        locationLabel: 'Self-Checkout Exit Gate',
        isSimulatedSource: false,
      })

      return { success: true, pass: newPass }
    },
    [
      isSessionCompleted,
      reconciliation.overallState,
      reconciliation.discrepancies.length,
      exitPass,
      digitalItemCount,
      digitalSubtotal,
      tax,
      grandTotal,
      digitalItems,
      logEvent,
    ],
  )

  const completeExitJourney = useCallback(() => {
    if (!exitPass && !isCheckoutCompleted) {
      return { success: false, message: 'Session has not been verified.' }
    }
    const nowIso = new Date().toISOString()
    setIsSessionCompleted(true)
    setIsCheckoutCompleted(true)
    setExitPass((prev) => (prev ? { ...prev, completedAt: nowIso } : null))

    logEvent({
      id: `exit-comp-${Date.now().toString().slice(-6)}`,
      sessionId: ACTIVE_SESSION_ID,
      type: 'exit_completed',
      description: `Customer completed exit journey for ${ACTIVE_CART_LABEL}. Turnstile gate unlocked (simulated). Session archived.`,
      occurredAt: nowIso,
      severity: 'success',
      locationLabel: 'Lane 1 Exit Turnstile',
      isSimulatedSource: false,
    })

    return { success: true, message: 'Exit journey completed successfully.' }
  }, [exitPass, isCheckoutCompleted, logEvent])

  // Backward compatibility wrapper for checkout
  const completeActiveCheckout = useCallback(
    (paymentMethod = 'Apple Pay (Demo)') => {
      const res = confirmAndIssueExitPass(paymentMethod)
      if (res.pass) {
        return {
          receiptId: `REC-${res.pass.passId.replace('PASS-', '')}`,
          sessionId: res.pass.sessionId,
          cartLabel: res.pass.cartLabel,
          storeName: res.pass.storeName,
          completedAt: res.pass.issuedAt,
          items: res.pass.items,
          subtotal: res.pass.subtotal,
          tax,
          total: res.pass.total,
          paymentMethod: res.pass.paymentMethod,
          exitCode: res.pass.exitCode,
        }
      }
      return {
        receiptId: `REC-${Date.now().toString().slice(-6)}`,
        sessionId: ACTIVE_SESSION_ID,
        cartLabel: ACTIVE_CART_LABEL,
        storeName: ACTIVE_STORE_NAME,
        completedAt: new Date().toISOString(),
        items: [...digitalItems],
        subtotal: digitalSubtotal,
        tax,
        total: grandTotal,
        paymentMethod,
        exitCode: `SYNCART-GATE-PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      }
    },
    [confirmAndIssueExitPass, digitalItems, digitalSubtotal, tax, grandTotal],
  )

  // ── 13. PREDICTABLE DEMO STATE RESET ────────────────────────────────
  const resetInteractiveSession = useCallback(() => {
    // 1. Restore baseline digital items
    setDigitalItems(
      INITIAL_BASELINE_PRODUCTS.map((p) => ({
        product: p.product,
        quantity: p.quantity,
        addedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      })),
    )

    // 2. Restore baseline physical items
    setPhysicalItems(
      INITIAL_BASELINE_PRODUCTS.map((p) => ({
        product: p.product,
        quantity: p.quantity,
        detectedAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
        matched: true,
        observationConfidence: p.confidence,
        sourceLabel: 'Shelf Optical + Weight Telemetry',
      })),
    )

    // 3. Clear uncertain observations, live events, and reset flags
    setUncertainObservations([])
    setLiveEvents([])
    setProcessedEventIds(new Set())
    setLiveVerificationCases([])
    setIsCheckoutCompleted(false)
    setCheckoutReceipt(null)
    setHasRequestedExit(false)
    setIsSessionCompleted(false)
    setExitPass(null)
    setShelfZones(DEMO_SHELF_ZONES)

    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }

    logEvent({
      id: `reset-${Date.now().toString().slice(-6)}`,
      sessionId: ACTIVE_SESSION_ID,
      type: 'reconciliation_complete',
      description: `Interactive demo session reset to baseline clean MATCH state.`,
      occurredAt: new Date().toISOString(),
      severity: 'info',
      locationLabel: 'System Controller',
      isSimulatedSource: false,
    })
  }, [logEvent])

  return (
    <ReconciliationContext.Provider
      value={{
        activeSessionId: ACTIVE_SESSION_ID,
        activeCartLabel: ACTIVE_CART_LABEL,
        activeShopperLabel: ACTIVE_SHOPPER_LABEL,
        activeStoreName: ACTIVE_STORE_NAME,
        activeSession,
        allSessions,
        isSessionActive: !isSessionCompleted && !isCheckoutCompleted,
        isCheckoutCompleted,
        checkoutReceipt,
        digitalItems,
        physicalItems,
        uncertainObservations,
        reconciliation,
        reconciliationStatus: reconciliation.overallState,
        discrepancies: reconciliation.discrepancies,
        reconciledRows: reconciliation.matchedItems,
        digitalTotal: digitalSubtotal,
        digitalItemCount,
        physicalTotal: physicalSubtotal,
        physicalItemCount,
        tax,
        grandTotal,
        allEvents,
        processedEventIds: Array.from(processedEventIds),
        shelfZones,
        allVerificationCases,
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
        invalidateExitClearance,
      }}
    >
      {children}
    </ReconciliationContext.Provider>
  )
}

export function useReconciliation() {
  const context = useContext(ReconciliationContext)
  if (!context) {
    throw new Error('useReconciliation must be used within a ReconciliationProvider')
  }
  return context
}
