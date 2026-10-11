/**
 * SimulatorEventsContext — Phase 3 & Phase 4 Vision & Shopping Event Simulator state.
 *
 * Connected in Phase 4 to the centralized ReconciliationEngine so that
 * simulated shelf interactions (PICK, RETURN, MOVE, SWAP) feed directly into
 * the active session's physical cart and trigger deterministic reconciliation.
 */
import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import { DEMO_SHELF_ZONES, PRODUCTS } from '@/data/demo'
import type {
  ShelfZone,
  ShoppingEvent,
  SimulatedVisionEvent,
  SimulatedInteractionType,
  Product,
} from '@/types/domain'
import { useReconciliation, ACTIVE_SESSION_ID } from '@/context/ReconciliationContext'

export interface GenerateEventParams {
  sessionId: string
  productSku: string
  shelfZoneId: string
  slotPosition: string
  interactionType: SimulatedInteractionType
  confidence: number
  scenarioNote?: string
}

export interface PresetScenario {
  id: string
  title: string
  description: string
  interactionType: SimulatedInteractionType
  sessionId: string
  product: Product
  zoneId: string
  position: string
  confidence: number
  note: string
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'preset-pick-eggs',
    title: 'Normal Product Pickup',
    description: 'Shopper lifts Free-Range Eggs from Dairy shelf. Optical shelf sensor detects weight reduction.',
    interactionType: 'PICK',
    sessionId: ACTIVE_SESSION_ID,
    product: PRODUCTS.EGGS,
    zoneId: 'zone-dairy',
    position: 'A2',
    confidence: 94,
    note: 'Clear hand occlusion and shelf weight delta (-0.68 kg). High certainty detection.',
  },
  {
    id: 'preset-return-water',
    title: 'Product Return to Shelf',
    description: 'Shopper returns Sparkling Water 12-pack onto beverage shelf after inspection.',
    interactionType: 'RETURN',
    sessionId: ACTIVE_SESSION_ID,
    product: PRODUCTS.WATER,
    zoneId: 'zone-beverages',
    position: 'A1',
    confidence: 91,
    note: 'Barcode face visible during return trajectory. Weight restoration verified.',
  },
  {
    id: 'preset-move-pasta',
    title: 'Product Displacement (Move)',
    description: 'Shopper nudges Penne Pasta laterally while reaching for sauce behind it.',
    interactionType: 'MOVE',
    sessionId: ACTIVE_SESSION_ID,
    product: PRODUCTS.PASTA,
    zoneId: 'zone-pantry',
    position: 'A1',
    confidence: 86,
    note: 'SKU remained in shelf zone; bounding box shifted 18 cm horizontally.',
  },
  {
    id: 'preset-swap-cheese',
    title: 'Product SKU Swap',
    description: 'Shopper replaces Sharp Cheddar with Greek Yogurt in adjacent slot.',
    interactionType: 'SWAP',
    sessionId: ACTIVE_SESSION_ID,
    product: PRODUCTS.CHEESE,
    zoneId: 'zone-dairy',
    position: 'C1',
    confidence: 78,
    note: 'Different SKU placed in slot C1. Packaging color mismatch detected.',
  },
  {
    id: 'preset-low-conf-hummus',
    title: 'Low-Confidence Ambiguity',
    description: 'Shopper hand reaches near Deli shelf with partial view occlusion.',
    interactionType: 'PICK',
    sessionId: ACTIVE_SESSION_ID,
    product: PRODUCTS.HUMMUS,
    zoneId: 'zone-produce',
    position: 'B1',
    confidence: 42,
    note: 'Observation uncertain (<50%). Edge camera line-of-sight blocked by shopper sleeve.',
  },
]

interface SimulatorEventsContextType {
  shelfZones: ShelfZone[]
  simulatedEvents: SimulatedVisionEvent[]
  allEvents: ShoppingEvent[]
  generateEvent: (params: GenerateEventParams) => SimulatedVisionEvent
  runPreset: (presetId: string) => SimulatedVisionEvent | null
  clearSimulatorHistory: () => void
  lastGeneratedEvent: SimulatedVisionEvent | null
}

const SimulatorEventsContext = createContext<SimulatorEventsContextType | undefined>(undefined)

export function SimulatorEventsProvider({ children }: { children: ReactNode }) {
  const {
    shelfZones,
    allEvents,
    processSimulatorInteraction,
    resetInteractiveSession,
  } = useReconciliation()

  const [lastGeneratedEvent, setLastGeneratedEvent] = useState<SimulatedVisionEvent | null>(null)

  // Filter only simulated events from the unified event stream
  const simulatedEvents = useMemo(() => {
    return allEvents.filter(
      (e): e is SimulatedVisionEvent =>
        Boolean(e.isSimulatedSource) && 'interactionType' in e,
    )
  }, [allEvents])

  // Generate simulated event delegating to reconciliation engine
  const generateEvent = (params: GenerateEventParams): SimulatedVisionEvent => {
    const {
      productSku,
      shelfZoneId,
      slotPosition,
      interactionType,
      confidence,
      scenarioNote,
    } = params

    const res = processSimulatorInteraction({
      productSku,
      interactionType,
      confidence,
      shelfZoneId,
      slotPosition,
      scenarioNote,
    })

    if (res.event) {
      setLastGeneratedEvent(res.event)
      return res.event
    }

    // Fallback stub if return was rejected
    const fallbackZone = shelfZones.find((z) => z.id === shelfZoneId) || DEMO_SHELF_ZONES[0]
    const prod = Object.values(PRODUCTS).find((p) => p.sku === productSku) || PRODUCTS.EGGS
    const fallbackEvent: SimulatedVisionEvent = {
      id: `sim-rej-${Date.now().toString().slice(-6)}`,
      sessionId: params.sessionId,
      type: 'product_returned',
      interactionType,
      sku: productSku,
      productName: prod.name,
      shelfZoneId,
      shelfZoneLabel: fallbackZone.label,
      aisle: fallbackZone.aisle,
      slotPosition,
      occurredAt: new Date().toISOString(),
      description: res.message || `[REJECTED] Invalid ${interactionType} interaction`,
      severity: 'warning',
      confidence,
      locationLabel: `${fallbackZone.aisle} — ${fallbackZone.label}`,
      isSimulatedSource: true,
      sourceLabel: 'Simulated Optical Telemetry',
      scenarioNote: res.message,
    }
    setLastGeneratedEvent(fallbackEvent)
    return fallbackEvent
  }

  // Run preset scenario
  const runPreset = (presetId: string): SimulatedVisionEvent | null => {
    const preset = PRESET_SCENARIOS.find((p) => p.id === presetId)
    if (!preset) return null

    return generateEvent({
      sessionId: preset.sessionId,
      productSku: preset.product.sku,
      shelfZoneId: preset.zoneId,
      slotPosition: preset.position,
      interactionType: preset.interactionType,
      confidence: preset.confidence,
      scenarioNote: preset.note,
    })
  }

  // Clear simulator history with state restore
  const clearSimulatorHistory = () => {
    resetInteractiveSession()
    setLastGeneratedEvent(null)
  }

  return (
    <SimulatorEventsContext.Provider
      value={{
        shelfZones,
        simulatedEvents,
        allEvents,
        generateEvent,
        runPreset,
        clearSimulatorHistory,
        lastGeneratedEvent,
      }}
    >
      {children}
    </SimulatorEventsContext.Provider>
  )
}

export function useSimulatorEvents() {
  const context = useContext(SimulatorEventsContext)
  if (!context) {
    throw new Error('useSimulatorEvents must be used within a SimulatorEventsProvider')
  }
  return context
}
