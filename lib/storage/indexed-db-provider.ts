import { type StorageProvider, STORE_NAMES } from "./storage-interface"

export class IndexedDBProvider implements StorageProvider {
  private db: IDBDatabase | null = null
  private dbName = "LostAndFoundDB"
  private dbVersion = 1
  private isConnectedFlag = false

  constructor(options?: { dbName?: string; dbVersion?: number }) {
    if (options?.dbName) {
      this.dbName = options.dbName
    }
    if (options?.dbVersion) {
      this.dbVersion = options.dbVersion
    }
  }

  async connect(): Promise<void> {
    if (this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = (event) => {
        console.error("Error opening IndexedDB:", event)
        reject(new Error("Failed to open IndexedDB"))
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        this.isConnectedFlag = true
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_NAMES.LAPEL_BADGES)) {
          db.createObjectStore(STORE_NAMES.LAPEL_BADGES, { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.HIGH_VALUE_ITEMS)) {
          db.createObjectStore(STORE_NAMES.HIGH_VALUE_ITEMS, { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.MISSING_ITEMS)) {
          db.createObjectStore(STORE_NAMES.MISSING_ITEMS, { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.RETURNED_ITEMS)) {
          db.createObjectStore(STORE_NAMES.RETURNED_ITEMS, { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.SETTINGS)) {
          db.createObjectStore(STORE_NAMES.SETTINGS, { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.COUNTERS)) {
          db.createObjectStore(STORE_NAMES.COUNTERS, { keyPath: "id" })
        }
      }
    })
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isConnectedFlag = false
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag
  }

  private getObjectStore(storeName: string, mode: IDBTransactionMode = "readonly"): IDBObjectStore {
    if (!this.db) {
      throw new Error("Database not connected")
    }

    const transaction = this.db.transaction(storeName, mode)
    return transaction.objectStore(storeName)
  }

  async getItem<T>(storeName: string, id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getObjectStore(storeName)
        const request = store.get(id)

        request.onsuccess = () => {
          resolve(request.result || null)
        }

        request.onerror = (event) => {
          console.error(`Error getting item from ${storeName}:`, event)
          reject(new Error(`Failed to get item from ${storeName}`))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  async getAllItems<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getObjectStore(storeName)
        const request = store.getAll()

        request.onsuccess = () => {
          resolve(request.result || [])
        }

        request.onerror = (event) => {
          console.error(`Error getting all items from ${storeName}:`, event)
          reject(new Error(`Failed to get all items from ${storeName}`))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  async setItem<T>(storeName: string, item: T): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getObjectStore(storeName, "readwrite")
        const request = store.put(item)

        request.onsuccess = () => {
          resolve(item)
        }

        request.onerror = (event) => {
          console.error(`Error setting item in ${storeName}:`, event)
          reject(new Error(`Failed to set item in ${storeName}`))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  async updateItem<T>(storeName: string, id: string, updates: Partial<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        const item = await this.getItem<T>(storeName, id)
        if (!item) {
          reject(new Error(`Item with id ${id} not found in ${storeName}`))
          return
        }

        const updatedItem = { ...item, ...updates }
        await this.setItem(storeName, updatedItem)
        resolve(updatedItem)
      } catch (error) {
        reject(error)
      }
    })
  }

  async deleteItem(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getObjectStore(storeName, "readwrite")
        const request = store.delete(id)

        request.onsuccess = () => {
          resolve()
        }

        request.onerror = (event) => {
          console.error(`Error deleting item from ${storeName}:`, event)
          reject(new Error(`Failed to delete item from ${storeName}`))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  async bulkSetItems<T>(storeName: string, items: T[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getObjectStore(storeName, "readwrite")

        let completed = 0
        let errors = 0

        items.forEach((item) => {
          const request = store.put(item)

          request.onsuccess = () => {
            completed++
            if (completed + errors === items.length) {
              if (errors > 0) {
                reject(new Error(`Failed to set ${errors} items in ${storeName}`))
              } else {
                resolve()
              }
            }
          }

          request.onerror = (event) => {
            console.error(`Error setting item in ${storeName}:`, event)
            errors++
            if (completed + errors === items.length) {
              reject(new Error(`Failed to set ${errors} items in ${storeName}`))
            }
          }
        })

        // If no items to process, resolve immediately
        if (items.length === 0) {
          resolve()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  async clearStore(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getObjectStore(storeName, "readwrite")
        const request = store.clear()

        request.onsuccess = () => {
          resolve()
        }

        request.onerror = (event) => {
          console.error(`Error clearing store ${storeName}:`, event)
          reject(new Error(`Failed to clear store ${storeName}`))
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  async clearAllStores(): Promise<void> {
    try {
      for (const storeName of Object.values(STORE_NAMES)) {
        await this.clearStore(storeName)
      }
    } catch (error) {
      throw error
    }
  }

  async exportData(): Promise<string> {
    try {
      const data: Record<string, any[]> = {}

      for (const storeName of Object.values(STORE_NAMES)) {
        data[storeName] = await this.getAllItems(storeName)
      }

      return JSON.stringify(data)
    } catch (error) {
      console.error("Error exporting data:", error)
      throw new Error("Failed to export data")
    }
  }

  async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data)

      for (const storeName of Object.values(STORE_NAMES)) {
        if (parsedData[storeName]) {
          await this.clearStore(storeName)
          await this.bulkSetItems(storeName, parsedData[storeName])
        }
      }
    } catch (error) {
      console.error("Error importing data:", error)
      throw new Error("Failed to import data")
    }
  }
}

