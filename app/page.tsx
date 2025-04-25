"use client"

import { useEffect, useState, useCallback } from "react"
import LoginScreen from "@/components/login-screen"
import LandingPage from "@/components/landing-page"
import LogSelection from "@/components/log-selection"
import LapelBadgeLog from "@/components/lapel-badge-log"
import HighValueItemsLog from "@/components/high-value-items-log"
import ReturnedItemsLog from "@/components/returned-items-log"
import MissingItemsLog from "@/components/missing-items-log"
import LapelBadgeFormWrapper from "@/components/lapel-badge-form-wrapper"
import HighValueItemFormWrapper from "@/components/high-value-item-form-wrapper"
import MissingItemFormWrapper from "@/components/missing-item-form-wrapper"
import SettingsPanel from "@/components/settings-panel"
import { useAutoLock } from "@/hooks/use-auto-lock"
import { initializeStorage, setupAutomaticExport, subscribeToRealtimeUpdates } from "@/lib/storage"
import { Cog } from "lucide-react"
import { Button } from "@/components/ui/button"
import SyncIndicator from "@/components/sync-indicator"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState("landing")
  const [showSettings, setShowSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const { toast } = useToast()

  // Initialize auto-lock functionality
  useAutoLock(isLoggedIn, () => setIsLoggedIn(false))

  // Create a stable notification function
  const showNotification = useCallback(
    (title: string, description: string, variant: "default" | "destructive" | "warning" = "default") => {
      toast({ title, description, variant })
    },
    [toast],
  )

  // Initialize the app
  useEffect(() => {
    const initApp = async () => {
      try {
        // Check login state
        const storedLoginState = localStorage.getItem("isLoggedIn")
        if (storedLoginState === "true") {
          setIsLoggedIn(true)
        }

        // Initialize storage manager
        const storageInitialized = await initializeStorage()

        if (!storageInitialized) {
          setInitError("Failed to initialize storage. Some features may not work correctly.")
          showNotification(
            "Storage Error",
            "There was an error initializing storage. Some features may not work correctly.",
            "destructive",
          )
        } else {
          // Set up automatic export
          setupAutomaticExport()

          // Show notification about storage
          showNotification(
            "Using Local Storage",
            "Your data is being stored locally on this device using IndexedDB.",
            "default",
          )
        }
      } catch (error) {
        console.error("Error initializing app:", error)
        setInitError("An unexpected error occurred. Please try refreshing the page.")
        showNotification(
          "Initialization Error",
          "There was an error starting the application. Please try refreshing the page.",
          "destructive",
        )
      } finally {
        // Set loading to false after initialization, regardless of errors
        setIsLoading(false)
      }
    }

    initApp()
  }, [showNotification])

  // Set up storage update listeners
  useEffect(() => {
    if (!isLoggedIn) return

    // Subscribe to storage updates
    const unsubscribe = subscribeToRealtimeUpdates(() => {
      // This callback will be called when data changes
      console.log("Data updated")
    })

    // Clean up subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [isLoggedIn])

  const handleLogin = useCallback((password: string) => {
    if (password === "lf25") {
      setIsLoggedIn(true)
      localStorage.setItem("isLoggedIn", "true")
    }
  }, [])

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false)
    localStorage.removeItem("isLoggedIn")
  }, [])

  const goToLanding = useCallback(() => {
    setActiveTab("landing")
  }, [])

  const goToLogSelection = useCallback(() => {
    setActiveTab("log-selection")
  }, [])

  const renderContent = () => {
    if (showSettings) {
      return <SettingsPanel onClose={() => setShowSettings(false)} />
    }

    switch (activeTab) {
      case "landing":
        return <LandingPage onLogItemClick={goToLogSelection} setActiveTab={setActiveTab} />
      case "log-selection":
        return <LogSelection onBack={goToLanding} setActiveTab={setActiveTab} />
      case "lapel-badge-log":
        return <LapelBadgeLog onBackToMain={goToLanding} setActiveTab={setActiveTab} />
      case "high-value-items-log":
        return <HighValueItemsLog onBackToMain={goToLanding} setActiveTab={setActiveTab} />
      case "returned-items-log":
        return <ReturnedItemsLog onBackToMain={goToLanding} setActiveTab={setActiveTab} />
      case "missing-items-log":
        return <MissingItemsLog onBackToMain={goToLanding} setActiveTab={setActiveTab} />
      case "lapel-badge-form":
        return <LapelBadgeFormWrapper onBack={goToLogSelection} onComplete={goToLanding} />
      case "high-value-item-form":
        return <HighValueItemFormWrapper onBack={goToLogSelection} onComplete={goToLanding} />
      case "report-missing":
        return <MissingItemFormWrapper onBack={goToLogSelection} onComplete={goToLanding} />
      default:
        return <LandingPage onLogItemClick={goToLogSelection} setActiveTab={setActiveTab} />
    }
  }

  // Show loading state or login screen if not logged in
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (initError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Initialization Error</h1>
        <p className="mb-6">{initError}</p>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Lost and Found Logger</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className="rounded-full">
              <Cog className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
            <Button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Logout
            </Button>
          </div>
        </header>

        <main className="mt-6 bg-white rounded-lg shadow-md p-6">{renderContent()}</main>
      </div>
      <SyncIndicator />
    </div>
  )
}

