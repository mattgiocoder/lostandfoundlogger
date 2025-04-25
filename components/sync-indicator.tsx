"use client"

import { useState, useEffect } from "react"
import { DatabaseIcon } from "lucide-react"
import { getStorageMode } from "@/lib/storage"

export default function SyncIndicator() {
  const [storageMode, setStorageMode] = useState<"local" | "cloud">("local")

  useEffect(() => {
    // Initial setup
    function updateStorageMode() {
      setStorageMode(getStorageMode())
    }

    // Handle storage updates
    function handleStorageUpdate() {
      updateStorageMode()
    }

    // Set up initial state
    updateStorageMode()

    // Listen for storage mode changes
    window.addEventListener("storage-updated", handleStorageUpdate)
    window.addEventListener("storage-type-changed", handleStorageUpdate)

    // Clean up
    return () => {
      window.removeEventListener("storage-updated", handleStorageUpdate)
      window.removeEventListener("storage-type-changed", handleStorageUpdate)
    }
  }, []) // Empty dependency array - only run on mount and unmount

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-full shadow-md p-2 z-50">
      <DatabaseIcon className="h-6 w-6 text-blue-500" title="Using IndexedDB for local storage" />
    </div>
  )
}

