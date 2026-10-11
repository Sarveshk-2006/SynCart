/**
 * SYNCART Demo Data — Phase 0 + Phase 1
 *
 * All data is deterministic, internally consistent, and clearly scoped
 * to the demo environment. No live integrations are implied.
 *
 * Timestamps are computed relative to a fixed anchor (2026-10-11T09:30:00Z)
 * so data remains consistent across renders.
 *
 * Store: SYNCART Demo Store — Greenfield Market
 */

import type {
  OverviewMetrics,
  CartTwin,
  ShoppingEvent,
  VerificationCase,
  ShoppingSession,
  ShelfZone,
  DemoSettings,
} from '@/types/domain'

// ── Reference timestamp anchor ────────────────────────────────────────────
export const DEMO_ANCHOR = '2026-10-11T09:30:00.000Z'
export function minutesBefore(mins: number): string {
  return new Date(new Date(DEMO_ANCHOR).getTime() - mins * 60000).toISOString()
}
export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

// ── Product Catalogue ─────────────────────────────────────────────────────

export const PRODUCTS = {
  MILK:     { sku: 'PROD-00142', name: 'Organic Whole Milk (1 gal)',   category: 'Dairy',         priceUsd: 5.49,  imageEmoji: '🥛' },
  EGGS:     { sku: 'PROD-00387', name: 'Free-Range Eggs (12 ct)',      category: 'Dairy & Eggs',  priceUsd: 6.29,  imageEmoji: '🥚' },
  BREAD:    { sku: 'PROD-00891', name: 'Sourdough Bread Loaf',         category: 'Bakery',        priceUsd: 4.79,  imageEmoji: '🍞' },
  TOMATOES: { sku: 'PROD-01204', name: 'Cherry Tomatoes (pint)',       category: 'Produce',       priceUsd: 3.49,  imageEmoji: '🍅' },
  YOGURT:   { sku: 'PROD-02751', name: 'Greek Yogurt Plain (32 oz)',   category: 'Dairy',         priceUsd: 7.99,  imageEmoji: '🫙' },
  WATER:    { sku: 'PROD-01577', name: 'Sparkling Water 12-pack',      category: 'Beverages',     priceUsd: 8.49,  imageEmoji: '💧' },
  CEREAL:   { sku: 'PROD-03842', name: 'Granola Clusters (18 oz)',     category: 'Breakfast',     priceUsd: 5.99,  imageEmoji: '🌾' },
  BUTTER:   { sku: 'PROD-00253', name: 'Unsalted Butter (2 sticks)',   category: 'Dairy',         priceUsd: 4.29,  imageEmoji: '🧈' },
  APPLES:   { sku: 'PROD-01103', name: 'Honeycrisp Apples (3 lb bag)', category: 'Produce',       priceUsd: 6.49,  imageEmoji: '🍎' },
  CHICKEN:  { sku: 'PROD-04217', name: 'Boneless Chicken Breast (2 lb)',category: 'Meat',         priceUsd: 11.99, imageEmoji: '🍗' },
  PASTA:    { sku: 'PROD-02083', name: 'Penne Pasta (16 oz)',          category: 'Pantry',        priceUsd: 2.29,  imageEmoji: '🍝' },
  SAUCE:    { sku: 'PROD-02184', name: 'Marinara Sauce (24 oz)',       category: 'Pantry',        priceUsd: 3.99,  imageEmoji: '🥫' },
  CHEESE:   { sku: 'PROD-00461', name: 'Sharp Cheddar Block (8 oz)',   category: 'Dairy',         priceUsd: 5.29,  imageEmoji: '🧀' },
  SPINACH:  { sku: 'PROD-01356', name: 'Baby Spinach (5 oz bag)',      category: 'Produce',       priceUsd: 3.99,  imageEmoji: '🥬' },
  OJ:       { sku: 'PROD-01621', name: 'Orange Juice (52 oz)',         category: 'Beverages',     priceUsd: 4.99,  imageEmoji: '🍊' },
  SALMON:   { sku: 'PROD-04418', name: 'Atlantic Salmon Fillet (1 lb)',category: 'Seafood',       priceUsd: 12.99, imageEmoji: '🐟' },
  HUMMUS:   { sku: 'PROD-03119', name: 'Roasted Red Pepper Hummus',    category: 'Deli',          priceUsd: 4.49,  imageEmoji: '🫘' },
  CRACKERS: { sku: 'PROD-02911', name: 'Whole Wheat Crackers (9 oz)', category: 'Snacks',        priceUsd: 3.79,  imageEmoji: '🫓' },
} as const

// ── Overview Metrics ──────────────────────────────────────────────────────

export const DEMO_METRICS: OverviewMetrics = {
  activeSessionsCount: 14,
  reconciledSessionsCount: 238,
  pendingVerificationsCount: 3,
  resolvedMismatchesCount: 27,
  activeSessionsDelta: +2,
  reconciledSessionsDelta: +18,
  pendingVerificationsDelta: +1,
  resolvedMismatchesDelta: +4,
}

// ── Demo Sessions ─────────────────────────────────────────────────────────

export const DEMO_SESSIONS: ShoppingSession[] = [
  {
    id: 'sess-001',
    cartId: 'cart-a7f3',
    shopperLabel: 'Cart #A7F3',
    status: 'active',
    startedAt: minutesBefore(22),
    lastActivityAt: minutesBefore(2),
    itemCount: 5,
    physicalItemCount: 4,
    estimatedTotal: 28.05,
    mismatchCount: 1,
  },
  {
    id: 'sess-002',
    cartId: 'cart-b2d9',
    shopperLabel: 'Cart #B2D9',
    status: 'reconciling',
    startedAt: minutesBefore(45),
    lastActivityAt: minutesBefore(5),
    itemCount: 7,
    physicalItemCount: 8,
    estimatedTotal: 44.62,
    mismatchCount: 2,
  },
  {
    id: 'sess-003',
    cartId: 'cart-c1e6',
    shopperLabel: 'Cart #C1E6',
    status: 'reconciled',
    startedAt: minutesBefore(67),
    lastActivityAt: minutesBefore(18),
    itemCount: 5,
    physicalItemCount: 5,
    estimatedTotal: 24.90,
    mismatchCount: 0,
  },
  {
    id: 'sess-004',
    cartId: 'cart-d4b1',
    shopperLabel: 'Cart #D4B1',
    status: 'mismatch',
    startedAt: minutesBefore(38),
    lastActivityAt: minutesBefore(8),
    itemCount: 4,
    physicalItemCount: 5,
    estimatedTotal: 31.76,
    mismatchCount: 1,
  },
  {
    id: 'sess-005',
    cartId: 'cart-e9c2',
    shopperLabel: 'Cart #E9C2',
    status: 'active',
    startedAt: minutesBefore(12),
    lastActivityAt: minutesBefore(1),
    itemCount: 3,
    physicalItemCount: 3,
    estimatedTotal: 18.27,
    mismatchCount: 0,
  },
  {
    id: 'sess-006',
    cartId: 'cart-f7a8',
    shopperLabel: 'Cart #F7A8',
    status: 'exited',
    startedAt: minutesBefore(95),
    lastActivityAt: minutesBefore(40),
    itemCount: 9,
    physicalItemCount: 9,
    estimatedTotal: 62.43,
    mismatchCount: 0,
  },
  {
    id: 'sess-007',
    cartId: 'cart-g3f5',
    shopperLabel: 'Cart #G3F5',
    status: 'active',
    startedAt: minutesBefore(8),
    lastActivityAt: minutesBefore(0),
    itemCount: 2,
    physicalItemCount: 2,
    estimatedTotal: 11.28,
    mismatchCount: 0,
  },
  {
    id: 'sess-008',
    cartId: 'cart-h6d4',
    shopperLabel: 'Cart #H6D4',
    status: 'exited',
    startedAt: minutesBefore(120),
    lastActivityAt: minutesBefore(55),
    itemCount: 12,
    physicalItemCount: 11,
    estimatedTotal: 79.88,
    mismatchCount: 1,
  },
]

// ── Cart Twins ────────────────────────────────────────────────────────────

export const DEMO_CART_TWIN: CartTwin = {
  sessionId: 'sess-001',
  digital: [
    { product: PRODUCTS.MILK,     quantity: 1, addedAt: minutesBefore(20) },
    { product: PRODUCTS.EGGS,     quantity: 2, addedAt: minutesBefore(18) },
    { product: PRODUCTS.BREAD,    quantity: 1, addedAt: minutesBefore(15) },
    { product: PRODUCTS.TOMATOES, quantity: 1, addedAt: minutesBefore(12) },
    { product: PRODUCTS.YOGURT,   quantity: 1, addedAt: minutesBefore(9)  },
  ],
  physical: [
    { product: PRODUCTS.MILK,     quantity: 1, detectedAt: minutesBefore(19), matched: true,  observationConfidence: 94, sourceLabel: 'Aisle 3 — Dairy' },
    { product: PRODUCTS.EGGS,     quantity: 1, detectedAt: minutesBefore(17), matched: false, observationConfidence: 88, sourceLabel: 'Aisle 3 — Dairy & Eggs' },
    { product: PRODUCTS.BREAD,    quantity: 1, detectedAt: minutesBefore(14), matched: true,  observationConfidence: 97, sourceLabel: 'Bakery End-cap' },
    { product: PRODUCTS.TOMATOES, quantity: 1, detectedAt: minutesBefore(11), matched: true,  observationConfidence: 91, sourceLabel: 'Produce — Aisle 1' },
    { product: PRODUCTS.YOGURT,   quantity: 1, detectedAt: minutesBefore(8),  matched: true,  observationConfidence: 96, sourceLabel: 'Aisle 3 — Dairy' },
  ],
  discrepancies: [
    {
      sku: 'PROD-00387',
      productName: 'Free-Range Eggs (12 ct)',
      reason: 'quantity_discrepancy',
      digitalQty: 2,
      physicalQty: 1,
      description: 'Cart recorded 2 cartons but only 1 shelf-interaction event was detected. Second carton may not have been placed in cart yet or was returned to shelf.',
      resolution: 'Operator should confirm whether the second carton is in the cart or was left behind.',
    },
  ],
}

export const DEMO_CART_TWIN_B2D9: CartTwin = {
  sessionId: 'sess-002',
  digital: [
    { product: PRODUCTS.CHICKEN,  quantity: 1, addedAt: minutesBefore(43) },
    { product: PRODUCTS.PASTA,    quantity: 2, addedAt: minutesBefore(41) },
    { product: PRODUCTS.SAUCE,    quantity: 1, addedAt: minutesBefore(39) },
    { product: PRODUCTS.SPINACH,  quantity: 1, addedAt: minutesBefore(35) },
    { product: PRODUCTS.CHEESE,   quantity: 1, addedAt: minutesBefore(30) },
    { product: PRODUCTS.BUTTER,   quantity: 1, addedAt: minutesBefore(25) },
    { product: PRODUCTS.OJ,       quantity: 1, addedAt: minutesBefore(20) },
  ],
  physical: [
    { product: PRODUCTS.CHICKEN,  quantity: 1, detectedAt: minutesBefore(42), matched: true,  observationConfidence: 89, sourceLabel: 'Meat — Aisle 6' },
    { product: PRODUCTS.PASTA,    quantity: 2, detectedAt: minutesBefore(40), matched: true,  observationConfidence: 95, sourceLabel: 'Pantry — Aisle 5' },
    { product: PRODUCTS.SAUCE,    quantity: 1, detectedAt: minutesBefore(38), matched: true,  observationConfidence: 92, sourceLabel: 'Pantry — Aisle 5' },
    { product: PRODUCTS.SPINACH,  quantity: 1, detectedAt: minutesBefore(34), matched: true,  observationConfidence: 90, sourceLabel: 'Produce — Aisle 1' },
    { product: PRODUCTS.CHEESE,   quantity: 1, detectedAt: minutesBefore(29), matched: true,  observationConfidence: 87, sourceLabel: 'Aisle 3 — Dairy' },
    { product: PRODUCTS.BUTTER,   quantity: 1, detectedAt: minutesBefore(24), matched: true,  observationConfidence: 93, sourceLabel: 'Aisle 3 — Dairy' },
    { product: PRODUCTS.OJ,       quantity: 1, detectedAt: minutesBefore(19), matched: true,  observationConfidence: 96, sourceLabel: 'Beverages — Aisle 4' },
    // Extra physical item — cereal detected, not scanned
    { product: PRODUCTS.CEREAL,   quantity: 1, detectedAt: minutesBefore(15), matched: false, observationConfidence: 68, sourceLabel: 'Breakfast — Aisle 2' },
    // Extra physical item — hummus
    { product: PRODUCTS.HUMMUS,   quantity: 1, detectedAt: minutesBefore(10), matched: false, observationConfidence: 42, sourceLabel: 'Deli — Aisle 7' },
  ],
  discrepancies: [
    {
      sku: 'PROD-03842',
      productName: 'Granola Clusters (18 oz)',
      reason: 'unscanned_item',
      digitalQty: 0,
      physicalQty: 1,
      description: 'A shelf interaction for this product was detected in the physical cart but no corresponding barcode scan was recorded. The item may have been placed in the cart without scanning.',
      resolution: 'Review whether item was intentionally added but not scanned.',
    },
    {
      sku: 'PROD-03119',
      productName: 'Roasted Red Pepper Hummus',
      reason: 'extra_item_in_cart',
      digitalQty: 0,
      physicalQty: 1,
      description: 'Unidentified item weight event detected. Simulated confidence is low (42%). May be a mis-attributed shelf event from an adjacent zone.',
      resolution: 'Low-confidence event — verify whether item is actually in cart before escalating.',
    },
  ],
}

export const DEMO_CART_TWIN_C1E6: CartTwin = {
  sessionId: 'sess-003',
  digital: [
    { product: PRODUCTS.APPLES,   quantity: 1, addedAt: minutesBefore(65) },
    { product: PRODUCTS.HUMMUS,   quantity: 1, addedAt: minutesBefore(62) },
    { product: PRODUCTS.CRACKERS, quantity: 2, addedAt: minutesBefore(59) },
    { product: PRODUCTS.OJ,       quantity: 1, addedAt: minutesBefore(55) },
    { product: PRODUCTS.CHEESE,   quantity: 1, addedAt: minutesBefore(50) },
  ],
  physical: [
    { product: PRODUCTS.APPLES,   quantity: 1, detectedAt: minutesBefore(64), matched: true, observationConfidence: 96, sourceLabel: 'Produce — Aisle 1' },
    { product: PRODUCTS.HUMMUS,   quantity: 1, detectedAt: minutesBefore(61), matched: true, observationConfidence: 91, sourceLabel: 'Deli — Aisle 7' },
    { product: PRODUCTS.CRACKERS, quantity: 2, detectedAt: minutesBefore(58), matched: true, observationConfidence: 93, sourceLabel: 'Snacks — Aisle 8' },
    { product: PRODUCTS.OJ,       quantity: 1, detectedAt: minutesBefore(54), matched: true, observationConfidence: 97, sourceLabel: 'Beverages — Aisle 4' },
    { product: PRODUCTS.CHEESE,   quantity: 1, detectedAt: minutesBefore(49), matched: true, observationConfidence: 94, sourceLabel: 'Aisle 3 — Dairy' },
  ],
  discrepancies: [],
}

export const DEMO_CART_TWIN_D4B1: CartTwin = {
  sessionId: 'sess-004',
  digital: [
    { product: PRODUCTS.SALMON,   quantity: 1, addedAt: minutesBefore(36) },
    { product: PRODUCTS.SPINACH,  quantity: 1, addedAt: minutesBefore(33) },
    { product: PRODUCTS.BUTTER,   quantity: 1, addedAt: minutesBefore(30) },
    { product: PRODUCTS.CRACKERS, quantity: 1, addedAt: minutesBefore(26) },
  ],
  physical: [
    { product: PRODUCTS.SALMON,   quantity: 1, detectedAt: minutesBefore(35), matched: true,  observationConfidence: 82, sourceLabel: 'Seafood — Aisle 9' },
    { product: PRODUCTS.SPINACH,  quantity: 1, detectedAt: minutesBefore(32), matched: true,  observationConfidence: 91, sourceLabel: 'Produce — Aisle 1' },
    { product: PRODUCTS.BUTTER,   quantity: 1, detectedAt: minutesBefore(29), matched: true,  observationConfidence: 94, sourceLabel: 'Aisle 3 — Dairy' },
    { product: PRODUCTS.CRACKERS, quantity: 1, detectedAt: minutesBefore(25), matched: true,  observationConfidence: 90, sourceLabel: 'Snacks — Aisle 8' },
    // Extra item — water was picked and not scanned
    { product: PRODUCTS.WATER,    quantity: 1, detectedAt: minutesBefore(12), matched: false, observationConfidence: 79, sourceLabel: 'Beverages — Aisle 4' },
  ],
  discrepancies: [
    {
      sku: 'PROD-01577',
      productName: 'Sparkling Water 12-pack',
      reason: 'item_not_in_cart',
      digitalQty: 0,
      physicalQty: 1,
      description: 'A shelf interaction for Sparkling Water was detected after the other items were scanned. This item has no matching scan entry and may have been placed in the cart by mistake or deliberately without scanning.',
      resolution: 'Verify whether the item is in the physical cart before exit clearance.',
    },
  ],
}

// Map sessionId → CartTwin for easy lookup
export const CART_TWIN_BY_SESSION: Record<string, CartTwin> = {
  'sess-001': DEMO_CART_TWIN,
  'sess-002': DEMO_CART_TWIN_B2D9,
  'sess-003': DEMO_CART_TWIN_C1E6,
  'sess-004': DEMO_CART_TWIN_D4B1,
}

// ── Demo Shopping Events ──────────────────────────────────────────────────

export const DEMO_EVENTS: ShoppingEvent[] = [
  // ── sess-001 (A7F3) ─────────────
  { id: 'evt-001', sessionId: 'sess-001', type: 'session_started',        description: 'Cart #A7F3 — new session started at self-checkout entry', occurredAt: minutesBefore(22), severity: 'info' },
  { id: 'evt-002', sessionId: 'sess-001', type: 'barcode_scanned',         productName: 'Organic Whole Milk (1 gal)',   sku: 'PROD-00142', description: 'Barcode scanned — PROD-00142 added to digital cart', occurredAt: minutesBefore(20), severity: 'info' },
  { id: 'evt-003', sessionId: 'sess-001', type: 'product_picked',          productName: 'Organic Whole Milk (1 gal)',   sku: 'PROD-00142', description: 'Shelf interaction confirmed — PROD-00142 in physical cart', occurredAt: minutesBefore(19), severity: 'success', confidence: 94, locationLabel: 'Aisle 3' },
  { id: 'evt-004', sessionId: 'sess-001', type: 'barcode_scanned',         productName: 'Free-Range Eggs (12 ct)',      sku: 'PROD-00387', description: 'Barcode scanned — PROD-00387 ×2 added to digital cart', occurredAt: minutesBefore(18), severity: 'info' },
  { id: 'evt-005', sessionId: 'sess-001', type: 'product_picked',          productName: 'Free-Range Eggs (12 ct)',      sku: 'PROD-00387', description: 'Shelf interaction — 1 unit observed (digital shows ×2)', occurredAt: minutesBefore(17), severity: 'warning', confidence: 88, locationLabel: 'Aisle 3' },
  { id: 'evt-006', sessionId: 'sess-001', type: 'sku_mismatch',            productName: 'Free-Range Eggs (12 ct)',      sku: 'PROD-00387', description: 'Quantity discrepancy flagged — digital ×2, physical ×1', occurredAt: minutesBefore(16), severity: 'error' },
  { id: 'evt-007', sessionId: 'sess-001', type: 'barcode_scanned',         productName: 'Sourdough Bread Loaf',         sku: 'PROD-00891', description: 'Barcode scanned — PROD-00891 added to digital cart', occurredAt: minutesBefore(15), severity: 'info' },
  { id: 'evt-008', sessionId: 'sess-001', type: 'product_picked',          productName: 'Sourdough Bread Loaf',         sku: 'PROD-00891', description: 'Shelf interaction confirmed — PROD-00891 in physical cart', occurredAt: minutesBefore(14), severity: 'success', confidence: 97, locationLabel: 'Bakery' },
  { id: 'evt-009', sessionId: 'sess-001', type: 'barcode_scanned',         productName: 'Cherry Tomatoes (pint)',       sku: 'PROD-01204', description: 'Barcode scanned — PROD-01204 added to digital cart', occurredAt: minutesBefore(12), severity: 'info' },
  { id: 'evt-010', sessionId: 'sess-001', type: 'product_picked',          productName: 'Cherry Tomatoes (pint)',       sku: 'PROD-01204', description: 'Shelf interaction confirmed — PROD-01204 in physical cart', occurredAt: minutesBefore(11), severity: 'success', confidence: 91, locationLabel: 'Produce' },
  { id: 'evt-011', sessionId: 'sess-001', type: 'barcode_scanned',         productName: 'Greek Yogurt Plain (32 oz)',   sku: 'PROD-02751', description: 'Barcode scanned — PROD-02751 added to digital cart', occurredAt: minutesBefore(9), severity: 'info' },
  { id: 'evt-012', sessionId: 'sess-001', type: 'product_picked',          productName: 'Greek Yogurt Plain (32 oz)',   sku: 'PROD-02751', description: 'Shelf interaction confirmed — PROD-02751 in physical cart', occurredAt: minutesBefore(8), severity: 'success', confidence: 96, locationLabel: 'Aisle 3' },
  { id: 'evt-013', sessionId: 'sess-001', type: 'verification_requested',  description: 'Verification case created for PROD-00387 quantity discrepancy', occurredAt: minutesBefore(7), severity: 'warning' },

  // ── sess-002 (B2D9) ─────────────
  { id: 'evt-101', sessionId: 'sess-002', type: 'session_started',        description: 'Cart #B2D9 — new session started at self-checkout entry', occurredAt: minutesBefore(45), severity: 'info' },
  { id: 'evt-102', sessionId: 'sess-002', type: 'barcode_scanned',         productName: 'Boneless Chicken Breast (2 lb)',sku: 'PROD-04217', description: 'Barcode scanned — PROD-04217 added to digital cart', occurredAt: minutesBefore(43), severity: 'info' },
  { id: 'evt-103', sessionId: 'sess-002', type: 'product_picked',          productName: 'Boneless Chicken Breast (2 lb)',sku: 'PROD-04217', description: 'Shelf interaction confirmed — PROD-04217 in physical cart', occurredAt: minutesBefore(42), severity: 'success', confidence: 89, locationLabel: 'Meat Aisle' },
  { id: 'evt-104', sessionId: 'sess-002', type: 'barcode_scanned',         productName: 'Penne Pasta (16 oz)',          sku: 'PROD-02083', description: 'Barcode scanned — PROD-02083 ×2 added to digital cart', occurredAt: minutesBefore(41), severity: 'info' },
  { id: 'evt-105', sessionId: 'sess-002', type: 'product_picked',          productName: 'Penne Pasta (16 oz)',          sku: 'PROD-02083', description: 'Shelf interaction confirmed — PROD-02083 ×2 in physical cart', occurredAt: minutesBefore(40), severity: 'success', confidence: 95, locationLabel: 'Pantry Aisle' },
  { id: 'evt-106', sessionId: 'sess-002', type: 'barcode_scanned',         productName: 'Marinara Sauce (24 oz)',       sku: 'PROD-02184', description: 'Barcode scanned — PROD-02184 added to digital cart', occurredAt: minutesBefore(39), severity: 'info' },
  { id: 'evt-107', sessionId: 'sess-002', type: 'barcode_scanned',         productName: 'Baby Spinach (5 oz bag)',      sku: 'PROD-01356', description: 'Barcode scanned — PROD-01356 added to digital cart', occurredAt: minutesBefore(35), severity: 'info' },
  { id: 'evt-108', sessionId: 'sess-002', type: 'barcode_scanned',         productName: 'Sharp Cheddar Block (8 oz)',   sku: 'PROD-00461', description: 'Barcode scanned — PROD-00461 added to digital cart', occurredAt: minutesBefore(30), severity: 'info' },
  { id: 'evt-109', sessionId: 'sess-002', type: 'product_returned',        productName: 'Sparkling Water 12-pack',     sku: 'PROD-01577', description: 'Cart #B2D9 — item returned to shelf, removed from cart', occurredAt: minutesBefore(27), severity: 'info' },
  { id: 'evt-110', sessionId: 'sess-002', type: 'product_picked',          productName: 'Granola Clusters (18 oz)',     sku: 'PROD-03842', description: 'Shelf interaction detected — PROD-03842, no matching scan found', occurredAt: minutesBefore(15), severity: 'warning', confidence: 68, locationLabel: 'Breakfast Aisle' },
  { id: 'evt-111', sessionId: 'sess-002', type: 'sku_mismatch',            productName: 'Granola Clusters (18 oz)',     sku: 'PROD-03842', description: 'Unscanned item flagged — shelf event without corresponding scan', occurredAt: minutesBefore(14), severity: 'error' },
  { id: 'evt-112', sessionId: 'sess-002', type: 'product_picked',          productName: 'Roasted Red Pepper Hummus',   sku: 'PROD-03119', description: 'Low-confidence shelf event — possible mis-attribution', occurredAt: minutesBefore(10), severity: 'warning', confidence: 42, locationLabel: 'Deli Aisle' },
  { id: 'evt-113', sessionId: 'sess-002', type: 'verification_requested',  description: 'Verification case created for 2 suspected discrepancies', occurredAt: minutesBefore(9), severity: 'warning' },

  // ── sess-003 (C1E6) ─────────────
  { id: 'evt-201', sessionId: 'sess-003', type: 'session_started',        description: 'Cart #C1E6 — new session started at self-checkout entry', occurredAt: minutesBefore(67), severity: 'info' },
  { id: 'evt-202', sessionId: 'sess-003', type: 'barcode_scanned',         productName: 'Honeycrisp Apples (3 lb bag)', sku: 'PROD-01103', description: 'Barcode scanned — PROD-01103 added to digital cart', occurredAt: minutesBefore(65), severity: 'info' },
  { id: 'evt-203', sessionId: 'sess-003', type: 'product_picked',          productName: 'Honeycrisp Apples (3 lb bag)', sku: 'PROD-01103', description: 'Shelf interaction confirmed — PROD-01103 in physical cart', occurredAt: minutesBefore(64), severity: 'success', confidence: 96, locationLabel: 'Produce' },
  { id: 'evt-204', sessionId: 'sess-003', type: 'barcode_scanned',         productName: 'Roasted Red Pepper Hummus',   sku: 'PROD-03119', description: 'Barcode scanned — PROD-03119 added to digital cart', occurredAt: minutesBefore(62), severity: 'info' },
  { id: 'evt-205', sessionId: 'sess-003', type: 'barcode_scanned',         productName: 'Whole Wheat Crackers (9 oz)', sku: 'PROD-02911', description: 'Barcode scanned — PROD-02911 ×2 added to digital cart', occurredAt: minutesBefore(59), severity: 'info' },
  { id: 'evt-206', sessionId: 'sess-003', type: 'barcode_scanned',         productName: 'Orange Juice (52 oz)',        sku: 'PROD-01621', description: 'Barcode scanned — PROD-01621 added to digital cart', occurredAt: minutesBefore(55), severity: 'info' },
  { id: 'evt-207', sessionId: 'sess-003', type: 'barcode_scanned',         productName: 'Sharp Cheddar Block (8 oz)',  sku: 'PROD-00461', description: 'Barcode scanned — PROD-00461 added to digital cart', occurredAt: minutesBefore(50), severity: 'info' },
  { id: 'evt-208', sessionId: 'sess-003', type: 'reconciliation_complete', description: 'Cart #C1E6 — all 5 items reconciled, no discrepancies found', occurredAt: minutesBefore(18), severity: 'success' },
  { id: 'evt-209', sessionId: 'sess-003', type: 'session_exited',          description: 'Cart #C1E6 — cleared for exit, session closed', occurredAt: minutesBefore(17), severity: 'success' },

  // ── sess-004 (D4B1) ─────────────
  { id: 'evt-301', sessionId: 'sess-004', type: 'session_started',        description: 'Cart #D4B1 — new session started at self-checkout entry', occurredAt: minutesBefore(38), severity: 'info' },
  { id: 'evt-302', sessionId: 'sess-004', type: 'barcode_scanned',         productName: 'Atlantic Salmon Fillet (1 lb)', sku: 'PROD-04418', description: 'Barcode scanned — PROD-04418 added to digital cart', occurredAt: minutesBefore(36), severity: 'info' },
  { id: 'evt-303', sessionId: 'sess-004', type: 'product_picked',          productName: 'Atlantic Salmon Fillet (1 lb)', sku: 'PROD-04418', description: 'Shelf interaction confirmed — PROD-04418 in physical cart', occurredAt: minutesBefore(35), severity: 'success', confidence: 82, locationLabel: 'Seafood' },
  { id: 'evt-304', sessionId: 'sess-004', type: 'barcode_scanned',         productName: 'Baby Spinach (5 oz bag)',      sku: 'PROD-01356', description: 'Barcode scanned — PROD-01356 added to digital cart', occurredAt: minutesBefore(33), severity: 'info' },
  { id: 'evt-305', sessionId: 'sess-004', type: 'barcode_scanned',         productName: 'Unsalted Butter (2 sticks)',   sku: 'PROD-00253', description: 'Barcode scanned — PROD-00253 added to digital cart', occurredAt: minutesBefore(30), severity: 'info' },
  { id: 'evt-306', sessionId: 'sess-004', type: 'barcode_scanned',         productName: 'Whole Wheat Crackers (9 oz)', sku: 'PROD-02911', description: 'Barcode scanned — PROD-02911 added to digital cart', occurredAt: minutesBefore(26), severity: 'info' },
  { id: 'evt-307', sessionId: 'sess-004', type: 'product_picked',          productName: 'Sparkling Water 12-pack',     sku: 'PROD-01577', description: 'Shelf interaction detected — PROD-01577, no matching scan found', occurredAt: minutesBefore(12), severity: 'warning', confidence: 79, locationLabel: 'Beverages' },
  { id: 'evt-308', sessionId: 'sess-004', type: 'sku_mismatch',            productName: 'Sparkling Water 12-pack',     sku: 'PROD-01577', description: 'Extra item flagged — physical event with no scan entry', occurredAt: minutesBefore(11), severity: 'error' },
]

// ── Demo Verification Queue ───────────────────────────────────────────────

export const DEMO_VERIFICATION_CASES: VerificationCase[] = [
  {
    id: 'ver-001',
    sessionId: 'sess-001',
    shopperLabel: 'Cart #A7F3',
    mismatchReason: 'quantity_discrepancy',
    confidence: 'high',
    confidenceScore: 91,
    status: 'pending',
    priority: 'high',
    createdAt: minutesBefore(16),
    description: 'Free-Range Eggs (12 ct): 2 cartons scanned, 1 physical interaction event observed.',
    affectedSku: 'PROD-00387',
    affectedProductName: 'Free-Range Eggs (12 ct)',
    digitalQty: 2,
    physicalQty: 1,
    evidence: 'One shelf pick event at 09:13 with 88% confidence. Second expected pick not detected. Could indicate the item was scanned twice in error, or the second carton is still on the shelf.',
  },
  {
    id: 'ver-002',
    sessionId: 'sess-002',
    shopperLabel: 'Cart #B2D9',
    mismatchReason: 'unscanned_item',
    confidence: 'medium',
    confidenceScore: 68,
    status: 'in_review',
    priority: 'medium',
    createdAt: minutesBefore(31),
    description: 'Granola Clusters (18 oz): physical interaction detected, no barcode scan recorded.',
    affectedSku: 'PROD-03842',
    affectedProductName: 'Granola Clusters (18 oz)',
    digitalQty: 0,
    physicalQty: 1,
    evidence: 'Shelf interaction event at 09:15, confidence 68%. No matching scan in session record. Product price: $5.99.',
  },
  {
    id: 'ver-003',
    sessionId: 'sess-002',
    shopperLabel: 'Cart #B2D9',
    mismatchReason: 'extra_item_in_cart',
    confidence: 'low',
    confidenceScore: 42,
    status: 'pending',
    priority: 'low',
    createdAt: minutesBefore(28),
    description: 'Suspected extra item: low-confidence shelf event near Deli section, possible mis-attribution.',
    affectedSku: 'PROD-03119',
    affectedProductName: 'Roasted Red Pepper Hummus',
    digitalQty: 0,
    physicalQty: 1,
    evidence: 'Interaction at 09:20, confidence 42%. May be from adjacent product zone. Low reliability — treat as unconfirmed suspected discrepancy.',
  },
  {
    id: 'ver-004',
    sessionId: 'sess-004',
    shopperLabel: 'Cart #D4B1',
    mismatchReason: 'item_not_in_cart',
    confidence: 'medium',
    confidenceScore: 79,
    status: 'pending',
    priority: 'high',
    createdAt: minutesBefore(11),
    description: 'Sparkling Water 12-pack: detected in cart without corresponding scan. Cart in mismatch state.',
    affectedSku: 'PROD-01577',
    affectedProductName: 'Sparkling Water 12-pack',
    digitalQty: 0,
    physicalQty: 1,
    evidence: 'Shelf interaction at 09:18 with 79% confidence. Item is high-value ($8.49). Cart is flagged for mismatch. Operator review recommended before exit clearance.',
  },
]

// ── Shelf Zones (Vision Simulator) ───────────────────────────────────────

export const DEMO_SHELF_ZONES: ShelfZone[] = [
  {
    id: 'zone-dairy',
    label: 'Dairy & Eggs',
    aisle: 'Aisle 3',
    products: [
      {
        position: 'A1',
        product: PRODUCTS.MILK,
        currentStock: 8,
        expectedStock: 12,
        recentInteraction: { type: 'pick', detectedAt: minutesBefore(19), confidence: 94 },
      },
      {
        position: 'A2',
        product: PRODUCTS.EGGS,
        currentStock: 6,
        expectedStock: 8,
        recentInteraction: { type: 'pick', detectedAt: minutesBefore(17), confidence: 88 },
      },
      {
        position: 'B1',
        product: PRODUCTS.YOGURT,
        currentStock: 10,
        expectedStock: 10,
        recentInteraction: { type: 'pick', detectedAt: minutesBefore(8), confidence: 96 },
      },
      {
        position: 'B2',
        product: PRODUCTS.BUTTER,
        currentStock: 7,
        expectedStock: 8,
        recentInteraction: { type: 'pick', detectedAt: minutesBefore(24), confidence: 93 },
      },
      {
        position: 'C1',
        product: PRODUCTS.CHEESE,
        currentStock: 5,
        expectedStock: 6,
        recentInteraction: { type: 'pick', detectedAt: minutesBefore(29), confidence: 87 },
      },
    ],
  },
  {
    id: 'zone-produce',
    label: 'Produce',
    aisle: 'Aisle 1',
    products: [
      {
        position: 'A1',
        product: PRODUCTS.TOMATOES,
        currentStock: 14,
        expectedStock: 16,
        recentInteraction: { type: 'pick', detectedAt: minutesBefore(11), confidence: 91 },
      },
      {
        position: 'A2',
        product: PRODUCTS.SPINACH,
        currentStock: 9,
        expectedStock: 10,
        recentInteraction: { type: 'pick', detectedAt: minutesBefore(34), confidence: 90 },
      },
      {
        position: 'B1',
        product: PRODUCTS.APPLES,
        currentStock: 22,
        expectedStock: 24,
        recentInteraction: { type: 'pick', detectedAt: minutesBefore(64), confidence: 96 },
      },
    ],
  },
  {
    id: 'zone-pantry',
    label: 'Pantry',
    aisle: 'Aisle 5',
    products: [
      {
        position: 'A1',
        product: PRODUCTS.PASTA,
        currentStock: 18,
        expectedStock: 20,
        recentInteraction: { type: 'pick', detectedAt: minutesBefore(40), confidence: 95 },
      },
      {
        position: 'A2',
        product: PRODUCTS.SAUCE,
        currentStock: 11,
        expectedStock: 12,
        recentInteraction: { type: 'pick', detectedAt: minutesBefore(38), confidence: 92 },
      },
      {
        position: 'B1',
        product: PRODUCTS.CRACKERS,
        currentStock: 13,
        expectedStock: 15,
        recentInteraction: { type: 'return', detectedAt: minutesBefore(22), confidence: 85 },
      },
    ],
  },
  {
    id: 'zone-beverages',
    label: 'Beverages',
    aisle: 'Aisle 4',
    products: [
      {
        position: 'A1',
        product: PRODUCTS.WATER,
        currentStock: 20,
        expectedStock: 24,
        recentInteraction: { type: 'pick', detectedAt: minutesBefore(12), confidence: 79 },
      },
      {
        position: 'A2',
        product: PRODUCTS.OJ,
        currentStock: 14,
        expectedStock: 16,
        recentInteraction: { type: 'pick', detectedAt: minutesBefore(54), confidence: 97 },
      },
    ],
  },
]

// ── Demo Settings defaults ────────────────────────────────────────────────

export const DEFAULT_SETTINGS: DemoSettings = {
  storeName: 'Greenfield Market',
  storeId: 'STORE-GFM-001',
  reconciliationThreshold: 70,
  autoEscalateAfterMins: 15,
  showTimestamps: 'relative',
  compactMode: false,
}
