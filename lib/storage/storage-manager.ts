import {
  type StorageProvider,
  type StorageType,
  type StorageConfig,
  STORE_NAMES,
  type ExportSettings,
  type Counter,
} from "./storage-interface"
import { IndexedDBProvider } from "./indexed-db-provider"
import { FileProvider } from "./file-provider"
import type { LapelBadge, HighValueItem, MissingItem, ReturnedItem } from "@/types/items"
import jsPDF from "jspdf"
import "jspdf-autotable"

class StorageManager {
  private provider: StorageProvider | null = null
  private storageType: StorageType = "indexeddb"
  private initialized = false
  private exportSettings: ExportSettings = {
    enabled: true,
    interval: 60,
  }
  private exportIntervalId: number | null = null

  // Singleton instance
  private static instance: StorageManager

  private constructor() {}

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  async init(config?: StorageConfig): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // Use the provided config or load from localStorage
      if (config) {
        this.storageType = config.type
      } else {
        const savedType = localStorage.getItem("storageType")
        if (savedType && (savedType === "indexeddb" || savedType === "file")) {
          this.storageType = savedType as StorageType
        }
      }

      // Create and connect to the provider
      await this.connectToProvider(this.storageType, config?.options)

      // Load export settings
      await this.loadExportSettings()

      // Set up automatic export if enabled
      this.setupAutomaticExport()

      this.initialized = true

      // Dispatch event to notify components
      window.dispatchEvent(new Event("storage-initialized"))
    } catch (error) {
      console.error("Error initializing storage manager:", error)
      throw error
    }
  }

  private async connectToProvider(type: StorageType, options?: any): Promise<void> {
    // Disconnect from current provider if connected
    if (this.provider && this.provider.isConnected()) {
      await this.provider.disconnect()
    }

    // Create new provider based on type
    switch (type) {
      case "indexeddb":
        this.provider = new IndexedDBProvider(options)
        break
      case "file":
        this.provider = new FileProvider()
        break
      default:
        throw new Error(`Unsupported storage type: ${type}`)
    }

    // Connect to the provider
    await this.provider.connect()
    this.storageType = type

    // Save the storage type to localStorage for persistence
    localStorage.setItem("storageType", type)
  }

  private async loadExportSettings(): Promise<void> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    // Try to load settings
    const settings = await this.provider.getItem<ExportSettings>(STORE_NAMES.SETTINGS, "export-settings")

    if (settings) {
      this.exportSettings = settings
    } else {
      // Create default settings if not found
      const defaultSettings: ExportSettings = {
        enabled: true,
        interval: 60, // minutes
      }

      await this.provider.setItem(STORE_NAMES.SETTINGS, {
        id: "export-settings",
        ...defaultSettings,
      })
      this.exportSettings = defaultSettings
    }
  }

  async changeStorageType(type: StorageType, options?: any): Promise<void> {
    if (type === this.storageType) {
      return
    }

    try {
      // Export data from current provider
      const data = this.provider ? await this.provider.exportData() : "{}"

      // Connect to new provider
      await this.connectToProvider(type, options)

      // Import data to new provider
      if (this.provider) {
        await this.provider.importData(data)
      }

      // Update settings
      this.exportSettings.lastExport = Date.now()
      await this.saveExportSettings(this.exportSettings)

      // Dispatch event to notify components
      window.dispatchEvent(new Event("storage-type-changed"))
    } catch (error) {
      console.error("Error changing storage type:", error)
      throw error
    }
  }

  async saveExportSettings(settings: ExportSettings): Promise<void> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    this.exportSettings = settings
    await this.provider.setItem(STORE_NAMES.SETTINGS, {
      id: "export-settings",
      ...settings,
    })

    // Update automatic export
    this.setupAutomaticExport()

    // Dispatch event to notify components
    window.dispatchEvent(new Event("settings-updated"))
  }

  getExportSettings(): ExportSettings {
    return this.exportSettings
  }

  getStorageType(): StorageType {
    return this.storageType
  }

  isInitialized(): boolean {
    return this.initialized
  }

  // Item management methods
  async getLapelBadges(): Promise<LapelBadge[]> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    return await this.provider.getAllItems<LapelBadge>(STORE_NAMES.LAPEL_BADGES)
  }

  async addLapelBadge(badge: Omit<LapelBadge, "itemNumber">): Promise<LapelBadge> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    // Generate item number
    const itemNumber = await this.generateItemNumber("LP")

    const newBadge: LapelBadge = { ...badge, itemNumber }
    await this.provider.setItem(STORE_NAMES.LAPEL_BADGES, newBadge)

    // Dispatch event to notify components
    window.dispatchEvent(new Event("storage-updated"))

    return newBadge
  }

  async getHighValueItems(): Promise<HighValueItem[]> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    return await this.provider.getAllItems<HighValueItem>(STORE_NAMES.HIGH_VALUE_ITEMS)
  }

  async addHighValueItem(item: Omit<HighValueItem, "itemNumber">): Promise<HighValueItem> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    // Generate item number
    const itemNumber = await this.generateItemNumber("HV")

    const newItem: HighValueItem = { ...item, itemNumber }
    await this.provider.setItem(STORE_NAMES.HIGH_VALUE_ITEMS, newItem)

    // Dispatch event to notify components
    window.dispatchEvent(new Event("storage-updated"))

    return newItem
  }

  async getMissingItems(): Promise<MissingItem[]> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    return await this.provider.getAllItems<MissingItem>(STORE_NAMES.MISSING_ITEMS)
  }

  async addMissingItem(item: Omit<MissingItem, "itemNumber">): Promise<MissingItem> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    // Generate item number
    const itemNumber = await this.generateItemNumber("MS")

    const newItem: MissingItem = { ...item, itemNumber }
    await this.provider.setItem(STORE_NAMES.MISSING_ITEMS, newItem)

    // Dispatch event to notify components
    window.dispatchEvent(new Event("storage-updated"))

    return newItem
  }

  async getReunitedItems(): Promise<ReturnedItem[]> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    return await this.provider.getAllItems<ReturnedItem>(STORE_NAMES.RETURNED_ITEMS)
  }

  // Let's review and fix the markItemReunited method to ensure items are properly added to the reunited items list

  async markItemReunited(
    originalItemId: string,
    type: "lapel-badge" | "high-value" | "missing",
    recipientName: string,
    phoneNumber: string,
    returnedBy: string,
    returnTimestamp: string = new Date().toISOString(),
  ): Promise<void> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    let originalItem: LapelBadge | HighValueItem | MissingItem | null = null

    // Find the original item
    if (type === "lapel-badge") {
      originalItem = await this.provider.getItem<LapelBadge>(STORE_NAMES.LAPEL_BADGES, originalItemId)
    } else if (type === "high-value") {
      originalItem = await this.provider.getItem<HighValueItem>(STORE_NAMES.HIGH_VALUE_ITEMS, originalItemId)
    } else if (type === "missing") {
      originalItem = await this.provider.getItem<MissingItem>(STORE_NAMES.MISSING_ITEMS, originalItemId)
    }

    if (!originalItem) {
      throw new Error("Original item not found")
    }

    // Update the status of the original item
    if (type === "lapel-badge") {
      await this.provider.updateItem<LapelBadge>(STORE_NAMES.LAPEL_BADGES, originalItemId, { status: "returned" })
    } else if (type === "high-value") {
      await this.provider.updateItem<HighValueItem>(STORE_NAMES.HIGH_VALUE_ITEMS, originalItemId, {
        status: "returned",
      })
    } else if (type === "missing") {
      await this.provider.updateItem<MissingItem>(STORE_NAMES.MISSING_ITEMS, originalItemId, { status: "returned" })
    }

    // Create the returned item record
    const returnedItem: ReturnedItem = {
      id: Date.now().toString(),
      originalItemId,
      type,
      originalItem,
      recipientName,
      phoneNumber,
      returnedBy,
      returnTimestamp,
    }

    await this.provider.setItem(STORE_NAMES.RETURNED_ITEMS, returnedItem)

    // Dispatch event to notify components
    window.dispatchEvent(new Event("storage-updated"))
  }

  async undoReunite(returnedItemId: string): Promise<void> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    // Get the returned item
    const returnedItem = await this.provider.getItem<ReturnedItem>(STORE_NAMES.RETURNED_ITEMS, returnedItemId)
    if (!returnedItem) {
      throw new Error("Returned item not found")
    }

    // Update the status of the original item back to "found"
    if (returnedItem.type === "lapel-badge") {
      await this.provider.updateItem<LapelBadge>(STORE_NAMES.LAPEL_BADGES, returnedItem.originalItemId, {
        status: "found",
      })
    } else if (returnedItem.type === "high-value") {
      await this.provider.updateItem<HighValueItem>(STORE_NAMES.HIGH_VALUE_ITEMS, returnedItem.originalItemId, {
        status: "found",
      })
    } else if (returnedItem.type === "missing") {
      await this.provider.updateItem<MissingItem>(STORE_NAMES.MISSING_ITEMS, returnedItem.originalItemId, {
        status: "found",
      })
    }

    // Delete the returned item record
    await this.provider.deleteItem(STORE_NAMES.RETURNED_ITEMS, returnedItemId)

    // Dispatch event to notify components
    window.dispatchEvent(new Event("storage-updated"))
  }

  async markMissingItemAsFound(
    missingItemId: string,
    foundType: "lapel-badge" | "high-value",
    additionalData: any,
  ): Promise<void> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    // Get the missing item
    const missingItem = await this.provider.getItem<MissingItem>(STORE_NAMES.MISSING_ITEMS, missingItemId)
    if (!missingItem) {
      throw new Error("Missing item not found")
    }

    // Add the item to the appropriate log
    if (foundType === "lapel-badge") {
      await this.addLapelBadge({
        id: Date.now().toString(),
        name: additionalData.name,
        congregation: additionalData.congregation,
        whereFound: additionalData.whereFound,
        logger: missingItem.logger,
        timestamp: new Date().toISOString(),
        status: "found",
      })
    } else if (foundType === "high-value") {
      await this.addHighValueItem({
        id: Date.now().toString(),
        category: additionalData.category,
        description: missingItem.description,
        whereFound: additionalData.whereFound,
        logger: missingItem.logger,
        timestamp: new Date().toISOString(),
        status: "found",
      })
    }

    // Delete the missing item
    await this.provider.deleteItem(STORE_NAMES.MISSING_ITEMS, missingItemId)

    // Dispatch event to notify components
    window.dispatchEvent(new Event("storage-updated"))
  }

  async clearAllData(): Promise<void> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    await this.provider.clearStore(STORE_NAMES.LAPEL_BADGES)
    await this.provider.clearStore(STORE_NAMES.HIGH_VALUE_ITEMS)
    await this.provider.clearStore(STORE_NAMES.MISSING_ITEMS)
    await this.provider.clearStore(STORE_NAMES.RETURNED_ITEMS)

    // Reset counters
    await this.provider.clearStore(STORE_NAMES.COUNTERS)

    // Dispatch event to notify components
    window.dispatchEvent(new Event("storage-updated"))
  }

  // Helper methods
  private async generateItemNumber(prefix: string): Promise<string> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    // Get the counter for this prefix
    const counterId = `${prefix}-counter`
    let counter = await this.provider.getItem<Counter>(STORE_NAMES.COUNTERS, counterId)

    if (!counter) {
      counter = { id: counterId, value: 0 }
    }

    // Increment the counter
    counter.value += 1

    // Save the updated counter
    await this.provider.setItem(STORE_NAMES.COUNTERS, counter)

    // Generate the item number
    return `${prefix}${counter.value.toString().padStart(4, "0")}`
  }

  // Export/Import methods
  async exportData(): Promise<string> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    return await this.provider.exportData()
  }

  async importData(data: string): Promise<void> {
    if (!this.provider) {
      throw new Error("Provider not connected")
    }

    await this.provider.importData(data)

    // Dispatch event to notify components
    window.dispatchEvent(new Event("storage-updated"))
  }

  // File provider specific methods
  async saveToFile(): Promise<void> {
    if (!this.provider || !(this.provider instanceof FileProvider)) {
      throw new Error("File provider not connected")
    }
    ;(this.provider as FileProvider).saveToFile()
  }

  async loadFromFile(file: File): Promise<void> {
    if (!this.provider || !(this.provider instanceof FileProvider)) {
      throw new Error("File provider not connected")
    }

    await (this.provider as FileProvider).loadFromFile(file)

    // Dispatch event to notify components
    window.dispatchEvent(new Event("storage-updated"))
  }

  // PDF Export methods
  exportDataAsPDF(type: "lapel-badge" | "high-value" | "missing" | "returned" | "all"): void {
    const doc = new jsPDF()

    const exportLapelBadges = async () => {
      const lapelBadges = await this.getLapelBadges()
      if (lapelBadges.length > 0) {
        doc.text("Lapel Badges", 10, 10)
        // Define the table headers
        const headers = ["Item #", "Name", "Congregation", "Where Found", "Logged By", "Date", "Status"]

        // Map the data to the table format
        const data = lapelBadges.map((badge) => [
          badge.itemNumber,
          badge.name,
          badge.congregation,
          badge.whereFound,
          badge.logger,
          new Date(badge.timestamp).toLocaleString(),
          badge.status,
        ])

        // Add the table to the PDF
        ;(doc as any).autoTable({
          head: [headers],
          body: data,
          startY: 20,
        })
      }
    }

    const exportHighValueItems = async () => {
      const highValueItems = await this.getHighValueItems()
      if (highValueItems.length > 0) {
        if (type !== "high-value") doc.addPage()
        doc.text("High-Value Items", 10, 10)

        // Define the table headers
        const headers = ["Item #", "Category", "Description", "Where Found", "Logged By", "Date", "Status"]

        // Map the data to the table format
        const data = highValueItems.map((item) => [
          item.itemNumber,
          item.category,
          item.description,
          item.whereFound,
          item.logger,
          new Date(item.timestamp).toLocaleString(),
          item.status,
        ])

        // Add the table to the PDF
        ;(doc as any).autoTable({
          head: [headers],
          body: data,
          startY: 20,
        })
      }
    }

    const exportMissingItems = async () => {
      const missingItems = await this.getMissingItems()
      if (missingItems.length > 0) {
        if (type !== "missing") doc.addPage()
        doc.text("Missing Items", 10, 10)

        // Define the table headers
        const headers = [
          "Item #",
          "Description",
          "Last Location",
          "Reported By",
          "Phone Number",
          "Logged By",
          "Date",
          "Status",
        ]

        // Map the data to the table format
        const data = missingItems.map((item) => [
          item.itemNumber,
          item.description,
          item.lastLocation,
          item.reportedBy,
          item.phoneNumber,
          item.logger,
          new Date(item.timestamp).toLocaleString(),
          item.status,
        ])

        // Add the table to the PDF
        ;(doc as any).autoTable({
          head: [headers],
          body: data,
          startY: 20,
        })
      }
    }

    const exportReturnedItems = async () => {
      const returnedItems = await this.getReunitedItems()
      if (returnedItems.length > 0) {
        if (type !== "returned") doc.addPage()
        doc.text("Reunited Items", 10, 10)

        // Define the table headers
        const headers = [
          "Item #",
          "Item Type",
          "Item Details",
          "Recipient Name",
          "Phone Number",
          "Returned By",
          "Return Date",
        ]

        // Map the data to the table format
        const data = returnedItems.map((item) => {
          const originalItem = item.originalItem as any
          const itemDetails =
            item.type === "lapel-badge"
              ? `${originalItem.name} (${originalItem.congregation})`
              : item.type === "high-value"
                ? `${originalItem.category}: ${originalItem.description}`
                : originalItem.description

          return [
            originalItem.itemNumber,
            item.type === "lapel-badge"
              ? "Lapel Badge"
              : item.type === "high-value"
                ? "High-Value Item"
                : "Missing Item",
            itemDetails,
            item.recipientName,
            item.phoneNumber,
            item.returnedBy,
            new Date(item.returnTimestamp).toLocaleString(),
          ]
        })

        // Add the table to the PDF
        ;(doc as any).autoTable({
          head: [headers],
          body: data,
          startY: 20,
        })
      }
    }

    // Execute the export based on type
    const executeExport = async () => {
      try {
        if (type === "lapel-badge" || type === "all") {
          await exportLapelBadges()
        }

        if (type === "high-value" || type === "all") {
          await exportHighValueItems()
        }

        if (type === "missing" || type === "all") {
          await exportMissingItems()
        }

        if (type === "returned" || type === "all") {
          await exportReturnedItems()
        }

        // Save the PDF
        doc.save(`${type}-data.pdf`)

        // Update last export time
        this.exportSettings.lastExport = Date.now()
        await this.saveExportSettings(this.exportSettings)
      } catch (error) {
        console.error("Error exporting data as PDF:", error)
      }
    }

    executeExport()
  }

  // Automatic export setup
  private setupAutomaticExport(): void {
    // Clear any existing interval
    if (this.exportIntervalId !== null) {
      window.clearInterval(this.exportIntervalId)
      this.exportIntervalId = null
    }

    // Set up new interval if enabled
    if (this.exportSettings.enabled) {
      const interval = this.exportSettings.interval * 60 * 1000 // Convert minutes to milliseconds

      this.exportIntervalId = window.setInterval(() => {
        this.exportDataAsPDF("all")
      }, interval)
    }
  }
}

// Export the singleton instance
export const storageManager = StorageManager.getInstance()

