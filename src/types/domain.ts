/**
 * Core domain types for SYNCART.
 *
 * Phase 0 + Phase 1: Extended with priority, observation details,
 * evidence metadata, and richer session/event fields.
 */

// ── Status & severity enums ───────────────────────────────────────────────

export type SessionStatus =
  | 'active'
  | 'reconciling'
  | 'reconciled'
  | 'mismatch'
  | 'exited'

export type EventType =
  | 'product_picked'    // PICK
  | 'barcode_scanned'   // SCAN
  | 'product_returned'  // RETURN
  | 'product_moved'     // MOVE
  | 'product_swapped'   // SWAP
  | 'sku_mismatch'      // MISMATCH
  | 'reconciliation_complete' // RESOLUTION
  | 'reconciliation_evaluated'
  | 'discrepancy_resolved'
  | 'verification_requested'
  | 'exit_verification_requested'
  | 'exit_pass_issued'
  | 'exit_clearance_invalidated'
  | 'exit_completed'
  | 'session_started'
  | 'session_exited'    // EXIT_VERIFICATION

export type VerificationStatus =
  | 'pending'
  | 'in_review'
  | 'resolved'
  | 'escalated'

export type ReconciliationStatus = 'MATCH' | 'MISMATCH' | 'UNCERTAIN' | 'RESOLVED'

export type ExitVerificationState =
  | 'NOT_REQUESTED'
  | 'BLOCKED'
  | 'READY'
  | 'VERIFIED'
  | 'COMPLETED'

export type DiscrepancyCode =
  | 'PICK_NOT_SCANNED'
  | 'SCAN_PICK_UNCONFIRMED'
  | 'SKU_MISMATCH'
  | 'QUANTITY_MISMATCH'
  | 'LOW_CONFIDENCE'
  | 'INVALID_RETURN'

export type MismatchReason =
  | 'quantity_discrepancy'
  | 'unscanned_item'
  | 'wrong_sku'
  | 'extra_item_in_cart'
  | 'item_not_in_cart'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export type Priority = 'high' | 'medium' | 'low'

// ── Product ───────────────────────────────────────────────────────────────

export interface Product {
  sku: string
  name: string
  category: string
  priceUsd: number
  imageEmoji: string
}

// ── Cart Item ─────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product
  quantity: number
  /** Timestamp when the item was added / scanned */
  addedAt: string
}

// ── Physical Shelf Interaction Event ─────────────────────────────────────

export interface PhysicalInteraction {
  product: Product
  quantity: number
  /** Timestamp of simulated shelf detection event */
  detectedAt: string
  /** Whether this interaction has been matched to a digital cart entry */
  matched: boolean
  /** Simulated confidence score (0–100) for the detection event */
  observationConfidence?: number
  /** Label describing the source of the interaction */
  sourceLabel?: string
}

// ── Cart Twin ─────────────────────────────────────────────────────────────

export interface CartTwin {
  sessionId: string
  digital: CartItem[]
  physical: PhysicalInteraction[]
  discrepancies: Discrepancy[]
}

export interface Discrepancy {
  sku: string
  productName: string
  reason: MismatchReason
  digitalQty: number
  physicalQty: number
  description: string
  resolution?: string
}

export interface ReconciliationDiscrepancy extends Discrepancy {
  code: DiscrepancyCode
  uncertainQty?: number
  associatedEventIds?: string[]
  status: 'active' | 'resolved'
  guidance?: string
  resolvedAt?: string
  resolutionType?: string
}

export interface UncertainObservation {
  id: string
  product: Product
  quantity: number
  confidence: number
  observedAt: string
  shelfZoneLabel: string
  reason: string
  eventId: string
}

export interface ReconciledItem {
  product: Product
  digitalQty: number
  physicalQty: number
  uncertainQty?: number
  matchStatus: 'matched' | 'unscanned_pick' | 'unconfirmed_scan' | 'sku_mismatch' | 'uncertain'
  discrepancyCode?: DiscrepancyCode
}

export interface ActiveSessionReconciliation {
  sessionId: string
  overallState: ReconciliationStatus
  matchedItems: ReconciledItem[]
  discrepancies: ReconciliationDiscrepancy[]
  uncertainObservations: UncertainObservation[]
  digitalTotal: number
  physicalTotal: number
  digitalItemCount: number
  physicalItemCount: number
  lastReconciledAt: string
}

export interface ExitPass {
  passId: string
  sessionId: string
  cartLabel: string
  storeName: string
  issuedAt: string
  completedAt?: string
  exitCode: string
  itemCount: number
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  reconciliationStatus: ReconciliationStatus
  reconciledItemCount: number
  items: CartItem[]
  auditChecksum: string
  isSimulated: true
}

// ── Shopping Session ──────────────────────────────────────────────────────

export interface ShoppingSession {
  id: string
  cartId: string
  /** Simulated shopper identifier — never PII */
  shopperLabel: string
  status: SessionStatus
  startedAt: string
  lastActivityAt: string
  itemCount: number
  estimatedTotal: number
  mismatchCount: number
  /** Items physically observed (simulated) */
  physicalItemCount: number
}

// ── Shopping Event ────────────────────────────────────────────────────────

export interface ShoppingEvent {
  id: string
  sessionId: string
  type: EventType
  productName?: string
  sku?: string
  description: string
  occurredAt: string
  severity?: 'info' | 'warning' | 'error' | 'success'
  /** Simulated confidence for physical detection events */
  confidence?: number
  /** Location label, e.g. shelf zone */
  locationLabel?: string
  /** Explicit flag marking simulated vision generator event */
  isSimulatedSource?: boolean
}

// ── Simulated Vision Event (Phase 3) ──────────────────────────────────────

export type SimulatedInteractionType = 'PICK' | 'RETURN' | 'MOVE' | 'SWAP'

export interface SimulatedVisionEvent extends ShoppingEvent {
  interactionType: SimulatedInteractionType
  shelfZoneId: string
  shelfZoneLabel: string
  aisle: string
  slotPosition: string
  isSimulatedSource: true
  sourceLabel: string
  beforeStock?: number
  afterStock?: number
  scenarioNote?: string
}

// ── Verification Case ─────────────────────────────────────────────────────

export interface VerificationCase {
  id: string
  sessionId: string
  shopperLabel: string
  mismatchReason: MismatchReason
  confidence: ConfidenceLevel
  confidenceScore: number // 0–100
  status: VerificationStatus
  createdAt: string
  description: string
  priority: Priority
  affectedSku?: string
  affectedProductName?: string
  /** Evidence summary for operator review */
  evidence?: string
  /** Digital cart state for the affected item */
  digitalQty?: number
  /** Physical observation count for the affected item */
  physicalQty?: number
  /** ISO timestamp when the case was resolved */
  resolvedAt?: string
}

// ── Overview Metrics ──────────────────────────────────────────────────────

export interface OverviewMetrics {
  activeSessionsCount: number
  reconciledSessionsCount: number
  pendingVerificationsCount: number
  resolvedMismatchesCount: number
  /** Change relative to previous period, as a signed integer */
  activeSessionsDelta: number
  reconciledSessionsDelta: number
  pendingVerificationsDelta: number
  resolvedMismatchesDelta: number
}

// ── Shelf Zone (Vision Simulator) ─────────────────────────────────────────

export interface ShelfZone {
  id: string
  label: string
  aisle: string
  products: ShelfSlot[]
}

export interface ShelfSlot {
  position: string
  product: Product
  currentStock: number
  expectedStock: number
  recentInteraction?: {
    type: 'pick' | 'return' | 'move' | 'swap'
    detectedAt: string
    confidence: number
  }
}

// ── Settings ──────────────────────────────────────────────────────────────

export interface DemoSettings {
  storeName: string
  storeId: string
  reconciliationThreshold: number // confidence % below which to auto-flag
  autoEscalateAfterMins: number
  showTimestamps: 'relative' | 'absolute'
  compactMode: boolean
}
