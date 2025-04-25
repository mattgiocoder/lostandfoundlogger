// Define the interface for all storage providers
export interface StorageProvider {
  // Basic CRUD operations
  getItem<T>(storeName: string, id: string): Promise<T | null>
  getAllItems<T>(storeName: string): Promise<T[]>
  setItem<T>(storeName: string, item: T): Promise<T>
  updateItem<T>(storeName: string, id: string, updates: Partial<T>): Promise<T>
  deleteItem(storeName: string, id: string): Promise<void>

  // Batch operations
  bulkSetItems<T>(storeName: string, items: T[]): Promise<void>

  // Storage management
  clearStore(storeName: string): Promise<void>
  clearAllStores(): Promise<void>

  // Connection management
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean

  // Export/Import
  exportData(): Promise<string>
  importData(data: string): Promise<void>
}

// Define the storage types
export type StorageType = "indexeddb" | "file"

// Define the storage configuration
export interface StorageConfig {
  type: StorageType
  options?: any
}

// Define the store names
export const STORE_NAMES = {
  LAPEL_BADGES: "lapelBadges",
  HIGH_VALUE_ITEMS: "highValueItems",
  MISSING_ITEMS: "missingItems",
  RETURNED_ITEMS: "returnedItems",
  SETTINGS: "settings",
  COUNTERS: "counters",
}

// Define the export settings interface
export interface ExportSettings {
  enabled: boolean
  interval: number
  lastExport?: number
}

// Define the counter interface for generating sequential item numbers
export interface Counter {
  id: string
  value: number
}

