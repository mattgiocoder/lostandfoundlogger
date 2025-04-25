import { type StorageProvider, STORE_NAMES } from "./storage-interface"

export class FileProvider implements StorageProvider {
  private data: Record<string, any[]> = {}
  private isConnectedFlag = false

  constructor() {
    // Initialize empty stores
    Object.values(STORE_NAMES).forEach((storeName) => {
      this.data[storeName] = []
    })
  }

  async connect(): Promise<void> {
    // Load data from localStorage as a temporary cache
    try {
      const cachedData = localStorage.getItem("fileProviderCache")
      if (cachedData) {
        this.data = JSON.parse(cachedData)
      }
    } catch (error) {
      console.error("Error loading cached data:", error)
    }

    this.isConnectedFlag = true
  }

  async disconnect(): Promise<void> {
    // Save data to localStorage as a temporary cache
    try {
      localStorage.setItem("fileProviderCache", JSON.stringify(this.data))
    } catch (error) {
      console.error("Error saving cached data:", error)
    }

    this.isConnectedFlag = false
  }

  isConnected(): boolean {
    return this.isConnectedFlag
  }

  async getItem<T>(storeName: string, id: string): Promise<T | null> {
    if (!this.isConnected()) {
      throw new Error("Provider not connected")
    }

    const store = this.data[storeName] || []
    const item = store.find((item) => item.id === id)
    return item || null
  }

  async getAllItems<T>(storeName: string): Promise<T[]> {
    if (!this.isConnected()) {
      throw new Error("Provider not connected")
    }

    return this.data[storeName] || []
  }

  async setItem<T>(storeName: string, item: T): Promise<T> {
    if (!this.isConnected()) {
      throw new Error("Provider not connected")
    }

    if (!this.data[storeName]) {
      this.data[storeName] = []
    }

    const index = this.data[storeName].findIndex((i: any) => i.id === (item as any).id)

    if (index >= 0) {
      this.data[storeName][index] = item
    } else {
      this.data[storeName].push(item)
    }

    return item
  }

  async updateItem<T>(storeName: string, id: string, updates: Partial<T>): Promise<T> {
    if (!this.isConnected()) {
      throw new Error("Provider not connected")
    }

    if (!this.data[storeName]) {
      throw new Error(`Store ${storeName} not found`)
    }

    const index = this.data[storeName].findIndex((item: any) => item.id === id)

    if (index < 0) {
      throw new Error(`Item with id ${id} not found in ${storeName}`)
    }

    const updatedItem = { ...this.data[storeName][index], ...updates }
    this.data[storeName][index] = updatedItem

    return updatedItem
  }

  async deleteItem(storeName: string, id: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Provider not connected")
    }

    if (!this.data[storeName]) {
      return
    }

    this.data[storeName] = this.data[storeName].filter((item: any) => item.id !== id)
  }

  async bulkSetItems<T>(storeName: string, items: T[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Provider not connected")
    }

    if (!this.data[storeName]) {
      this.data[storeName] = []
    }

    // For each item, update if exists or add if not
    items.forEach((item) => {
      const index = this.data[storeName].findIndex((i: any) => i.id === (item as any).id)

      if (index >= 0) {
        this.data[storeName][index] = item
      } else {
        this.data[storeName].push(item)
      }
    })
  }

  async clearStore(storeName: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Provider not connected")
    }

    this.data[storeName] = []
  }

  async clearAllStores(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Provider not connected")
    }

    Object.keys(this.data).forEach((storeName) => {
      this.data[storeName] = []
    })
  }

  async exportData(): Promise<string> {
    if (!this.isConnected()) {
      throw new Error("Provider not connected")
    }

    return JSON.stringify(this.data)
  }

  async importData(data: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Provider not connected")
    }

    try {
      this.data = JSON.parse(data)
    } catch (error) {
      console.error("Error importing data:", error)
      throw new Error("Failed to import data: Invalid JSON")
    }
  }

  // Additional methods specific to FileProvider
  saveToFile(): void {
    try {
      const dataStr = JSON.stringify(this.data)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

      // Create a download link and trigger it
      const downloadLink = document.createElement("a")
      downloadLink.setAttribute("href", dataUri)
      downloadLink.setAttribute("download", "lost-and-found-data.json")
      downloadLink.style.display = "none"
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    } catch (error) {
      console.error("Error saving data to file:", error)
    }
  }

  async loadFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          this.data = data
          resolve()
        } catch (error) {
          reject(new Error("Failed to parse file: Invalid JSON"))
        }
      }

      reader.onerror = () => {
        reject(new Error("Failed to read file"))
      }

      reader.readAsText(file)
    })
  }
}

