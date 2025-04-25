// Base item interface
interface BaseItem {
  id: string
  itemNumber: string
  logger: string
  timestamp: string
  status: "found" | "returned" | "missing"
  whereFound: string
}

// Lapel Badge interface
export interface LapelBadge extends BaseItem {
  name: string
  congregation: string
}

// High-Value Item interface
export interface HighValueItem extends BaseItem {
  category: string
  description: string
}

// Missing Item interface
export interface MissingItem extends Omit<BaseItem, "whereFound"> {
  description: string
  lastLocation: string
  reportedBy: string
  phoneNumber: string
}

// Returned Item interface
export interface ReturnedItem {
  id: string
  originalItemId: string
  type: "lapel-badge" | "high-value" | "missing"
  originalItem: LapelBadge | HighValueItem | MissingItem
  recipientName: string
  phoneNumber: string
  returnedBy: string
  returnTimestamp: string
}

