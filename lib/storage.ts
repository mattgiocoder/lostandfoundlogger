import "jspdf-autotable"
import { storageManager } from "./storage/storage-manager"
import type { ExportSettings } from "./storage/storage-interface"
import type { LapelBadge, HighValueItem, MissingItem, ReturnedItem } from "@/types/items"

// Initialize the storage manager - but don't await it here
// We'll handle initialization in the app component
let storageInitialized = false

// Function to initialize storage
export async function initializeStorage() {
  if (storageInitialized) return

  try {
    await storageManager.init()
    storageInitialized = true
    return true
  } catch (error) {
    console.error("Failed to initialize storage manager:", error)
    return false
  }
}

// Function to get export settings
export function getExportSettings(): ExportSettings {
  return storageManager.getExportSettings()
}

// Function to set export settings
export function setExportSettings(settings: ExportSettings): void {
  storageManager.saveExportSettings(settings).catch((error) => {
    console.error("Failed to save export settings:", error)
  })
}

// Function to get storage mode
export function getStorageMode(): "local" | "cloud" {
  return storageManager.getStorageType() === "indexeddb" ? "local" : "cloud"
}

// Function to set storage mode
export function setStorageMode(mode: "local" | "cloud"): void {
  const type = mode === "local" ? "indexeddb" : "file"
  storageManager.changeStorageType(type).catch((error) => {
    console.error("Failed to change storage type:", error)
  })
}

// Function to export data as PDF
export function exportDataAsPDF(type: "lapel-badge" | "high-value" | "missing" | "returned" | "all"): void {
  storageManager.exportDataAsPDF(type)
}

// Function to set up automatic export
export function setupAutomaticExport(): void {
  // This is now handled by the storage manager
}

// Function to get lapel badges
export async function getLapelBadges(): Promise<LapelBadge[]> {
  try {
    return await storageManager.getLapelBadges()
  } catch (error) {
    console.error("Error getting lapel badges:", error)
    return []
  }
}

// Function to add a lapel badge
export async function addLapelBadge(badge: Omit<LapelBadge, "itemNumber">): Promise<LapelBadge> {
  return await storageManager.addLapelBadge(badge)
}

// Function to get high value items
export async function getHighValueItems(): Promise<HighValueItem[]> {
  try {
    return await storageManager.getHighValueItems()
  } catch (error) {
    console.error("Error getting high value items:", error)
    return []
  }
}

// Function to add a high value item
export async function addHighValueItem(item: Omit<HighValueItem, "itemNumber">): Promise<HighValueItem> {
  return await storageManager.addHighValueItem(item)
}

// Function to get missing items
export async function getMissingItems(): Promise<MissingItem[]> {
  try {
    return await storageManager.getMissingItems()
  } catch (error) {
    console.error("Error getting missing items:", error)
    return []
  }
}

// Function to add a missing item
export async function addMissingItem(item: Omit<MissingItem, "itemNumber">): Promise<MissingItem> {
  return await storageManager.addMissingItem(item)
}

// Function to get reunited items
export async function getReunitedItems(): Promise<ReturnedItem[]> {
  try {
    return await storageManager.getReunitedItems()
  } catch (error) {
    console.error("Error getting reunited items:", error)
    return []
  }
}

// Function to mark an item as reunited
export async function markItemReunited(
  originalItemId: string,
  type: "lapel-badge" | "high-value" | "missing",
  recipientName: string,
  phoneNumber: string,
  returnedBy: string,
  returnTimestamp: string = new Date().toISOString(),
): Promise<void> {
  await storageManager.markItemReunited(originalItemId, type, recipientName, phoneNumber, returnedBy, returnTimestamp)
}

// Function to undo a reunite action
export async function undoReunite(returnedItemId: string): Promise<void> {
  await storageManager.undoReunite(returnedItemId)
}

// Function to mark a missing item as found
export async function markMissingItemAsFound(
  missingItemId: string,
  foundType: "lapel-badge" | "high-value",
  additionalData: any,
): Promise<void> {
  await storageManager.markMissingItemAsFound(missingItemId, foundType, additionalData)
}

// Function to clear all data
export async function clearAllData(): Promise<void> {
  await storageManager.clearAllData()
}

// Function to subscribe to real-time updates
export function subscribeToRealtimeUpdates(callback: () => void): () => void {
  // Add event listener for storage updates
  const handleStorageUpdate = () => {
    callback()
  }

  window.addEventListener("storage-updated", handleStorageUpdate)

  // Return function to unsubscribe
  return () => {
    window.removeEventListener("storage-updated", handleStorageUpdate)
  }
}

// Function to perform initial sync
export async function initialSyncFromSupabase(): Promise<void> {
  // This is now handled by the storage manager
  return Promise.resolve()
}

// Function to mark Supabase error - no longer needed but kept for compatibility
export function markSupabaseError(): void {
  // No longer needed
}

// Function to retry Supabase connection - no longer needed but kept for compatibility
export async function retrySupabaseConnection(): Promise<boolean> {
  // No longer needed
  return Promise.resolve(true)
}

