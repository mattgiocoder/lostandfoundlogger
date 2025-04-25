"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { XIcon, DatabaseIcon, FileTextIcon, ClockIcon, InfoIcon, HardDriveIcon, CloudIcon } from "lucide-react"
import {
  clearAllData,
  exportDataAsPDF,
  getStorageMode,
  setStorageMode,
  getExportSettings,
  setExportSettings,
} from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { storageManager } from "@/lib/storage/storage-manager"

interface SettingsPanelProps {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { toast } = useToast()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isSecondConfirmDialogOpen, setIsSecondConfirmDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [storageMode, setStorageModeState] = useState<"local" | "cloud">("local")
  const [exportSettings, setExportSettingsState] = useState({
    enabled: true,
    interval: 60,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [storageStats, setStorageStats] = useState({
    lapelBadges: 0,
    highValueItems: 0,
    missingItems: 0,
    returnedItems: 0,
  })

  useEffect(() => {
    // Get current storage mode
    setStorageModeState(getStorageMode())

    // Get current export settings
    setExportSettingsState(getExportSettings())

    // Get storage stats
    const fetchStats = async () => {
      try {
        const lapelBadges = await storageManager.getLapelBadges()
        const highValueItems = await storageManager.getHighValueItems()
        const missingItems = await storageManager.getMissingItems()
        const returnedItems = await storageManager.getReunitedItems()

        setStorageStats({
          lapelBadges: lapelBadges.length,
          highValueItems: highValueItems.length,
          missingItems: missingItems.length,
          returnedItems: returnedItems.length,
        })
      } catch (error) {
        console.error("Error fetching storage stats:", error)
      }
    }

    fetchStats()
  }, [])

  const handleClearData = useCallback(() => {
    setIsConfirmDialogOpen(true)
  }, [])

  const confirmClearData = useCallback(() => {
    setIsConfirmDialogOpen(false)
    setIsSecondConfirmDialogOpen(true)
  }, [])

  const finalConfirmClearData = useCallback(async () => {
    setIsSecondConfirmDialogOpen(false)

    try {
      await clearAllData()
      toast({
        title: "Success",
        description: "All data has been cleared",
      })

      // Update storage stats
      setStorageStats({
        lapelBadges: 0,
        highValueItems: 0,
        missingItems: 0,
        returnedItems: 0,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear data",
        variant: "destructive",
      })
    }
  }, [toast])

  const handleExportData = useCallback(
    (type: "lapel-badge" | "high-value" | "missing" | "returned" | "all") => {
      exportDataAsPDF(type)
      toast({
        title: "Success",
        description: `${
          type === "lapel-badge"
            ? "Lapel badge"
            : type === "high-value"
              ? "High-value item"
              : type === "missing"
                ? "Missing item"
                : type === "returned"
                  ? "Returned item"
                  : "All"
        } data exported as PDF`,
      })
    },
    [toast],
  )

  const handleExportToFile = useCallback(async () => {
    try {
      await storageManager.saveToFile()
      toast({
        title: "Success",
        description: "Data exported to file successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data to file",
        variant: "destructive",
      })
    }
  }, [toast])

  const handleImportFromFile = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      })
      return
    }

    try {
      await storageManager.loadFromFile(selectedFile)
      setIsImportDialogOpen(false)
      setSelectedFile(null)
      toast({
        title: "Success",
        description: "Data imported from file successfully",
      })

      // Update storage stats after import
      const lapelBadges = await storageManager.getLapelBadges()
      const highValueItems = await storageManager.getHighValueItems()
      const missingItems = await storageManager.getMissingItems()
      const returnedItems = await storageManager.getReunitedItems()

      setStorageStats({
        lapelBadges: lapelBadges.length,
        highValueItems: highValueItems.length,
        missingItems: missingItems.length,
        returnedItems: returnedItems.length,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import data from file",
        variant: "destructive",
      })
    }
  }, [selectedFile, toast])

  const handleStorageModeChange = useCallback(
    (checked: boolean) => {
      const newMode = checked ? "cloud" : "local"
      setStorageModeState(newMode)
      setStorageMode(newMode)

      toast({
        title: "Storage Mode Changed",
        description: `Data will now be saved ${newMode === "cloud" ? "to a downloadable file" : "locally on this device"}`,
      })
    },
    [toast],
  )

  const handleExportEnabledChange = useCallback(
    (checked: boolean) => {
      const newSettings = { ...exportSettings, enabled: checked }
      setExportSettingsState(newSettings)
      setExportSettings(newSettings)

      toast({
        title: "Automatic Export " + (checked ? "Enabled" : "Disabled"),
        description: checked
          ? `PDFs will be automatically exported every ${newSettings.interval} minutes`
          : "Automatic PDF export has been disabled",
      })
    },
    [exportSettings, toast],
  )

  const handleExportIntervalChange = useCallback(
    (value: string) => {
      const interval = Number.parseInt(value, 10)
      const newSettings = { ...exportSettings, interval }
      setExportSettingsState(newSettings)
      setExportSettings(newSettings)

      toast({
        title: "Export Interval Changed",
        description: `PDFs will now be automatically exported every ${interval} minutes`,
      })
    },
    [exportSettings, toast],
  )

  const getTotalItems = () => {
    return (
      storageStats.lapelBadges + storageStats.highValueItems + storageStats.missingItems + storageStats.returnedItems
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Settings</h2>
        <Button variant="outline" onClick={onClose} className="flex items-center">
          <XIcon className="h-4 w-4 mr-2" />
          Exit Settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <InfoIcon className="h-5 w-5 mr-2" />
            Storage Information
          </CardTitle>
          <CardDescription>Current data storage status and statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex items-start mb-3">
              {storageMode === "cloud" ? (
                <CloudIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              ) : (
                <HardDriveIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              )}
              <div>
                <h3 className="font-medium text-blue-800">
                  {storageMode === "cloud" ? "File Storage Mode (Export/Import)" : "Local Storage Mode (IndexedDB)"}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {storageMode === "cloud"
                    ? "Your data is managed through file exports and imports. To preserve your data, export it regularly."
                    : "Your data is stored locally in your browser's database. It will persist between sessions but is limited to this device."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-gray-600">Lapel Badges</p>
                <p className="text-xl font-semibold">{storageStats.lapelBadges}</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-gray-600">High-Value Items</p>
                <p className="text-xl font-semibold">{storageStats.highValueItems}</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-gray-600">Missing Items</p>
                <p className="text-xl font-semibold">{storageStats.missingItems}</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-gray-600">Reunited Items</p>
                <p className="text-xl font-semibold">{storageStats.returnedItems}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Total Items:</strong> {getTotalItems()}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {storageMode === "cloud"
                  ? "Remember to export your data regularly to avoid data loss."
                  : "Your data is automatically saved in your browser's storage."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage Mode</CardTitle>
          <CardDescription>Choose where to save your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {storageMode === "cloud" ? (
                <FileTextIcon className="h-5 w-5 text-blue-500" />
              ) : (
                <DatabaseIcon className="h-5 w-5 text-gray-500" />
              )}
              <Label htmlFor="storage-mode">
                {storageMode === "cloud" ? "File Storage (Export/Import)" : "Local Storage (IndexedDB)"}
              </Label>
            </div>
            <Switch id="storage-mode" checked={storageMode === "cloud"} onCheckedChange={handleStorageModeChange} />
          </div>
          <p className="text-sm text-muted-foreground">
            {storageMode === "cloud"
              ? "Data can be exported to a file and imported later. Good for transferring data between devices."
              : "Data is saved in your browser's IndexedDB. Works offline and persists between sessions."}
          </p>

          {storageMode === "cloud" && (
            <div className="mt-4 space-y-4">
              <Button onClick={handleExportToFile} className="w-full">
                Export Data to File
              </Button>
              <Button onClick={() => setIsImportDialogOpen(true)} className="w-full">
                Import Data from File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Automatic PDF Export
          </CardTitle>
          <CardDescription>Configure automatic PDF export settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-export">Automatic PDF Export</Label>
            <Switch id="auto-export" checked={exportSettings.enabled} onCheckedChange={handleExportEnabledChange} />
          </div>

          {exportSettings.enabled && (
            <div className="space-y-2">
              <Label htmlFor="export-interval">Export Interval</Label>
              <Select value={exportSettings.interval.toString()} onValueChange={handleExportIntervalChange}>
                <SelectTrigger id="export-interval" className="w-full">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every hour</SelectItem>
                  <SelectItem value="120">Every 2 hours</SelectItem>
                  <SelectItem value="240">Every 4 hours</SelectItem>
                  <SelectItem value="480">Every 8 hours</SelectItem>
                  <SelectItem value="720">Every 12 hours</SelectItem>
                  <SelectItem value="1440">Every 24 hours</SelectItem>
                </SelectContent>
              </Select>

              {exportSettings.lastExport && (
                <p className="text-sm text-muted-foreground">
                  Last automatic export: {new Date(exportSettings.lastExport).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {exportSettings.enabled
              ? `PDFs will be automatically exported every ${exportSettings.interval} minutes.`
              : "Automatic PDF export is disabled. You can still export PDFs manually."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileTextIcon className="h-5 w-5 mr-2" />
            Manual Export
          </CardTitle>
          <CardDescription>Export data as PDF files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={() => handleExportData("lapel-badge")}>Export Lapel Badges</Button>
            <Button onClick={() => handleExportData("high-value")}>Export High-Value Items</Button>
            <Button onClick={() => handleExportData("missing")}>Export Missing Items</Button>
            <Button onClick={() => handleExportData("returned")}>Export Reunited Items</Button>
            <Button onClick={() => handleExportData("all")} className="md:col-span-2 bg-blue-600 hover:bg-blue-700">
              Export All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader className="text-red-600">
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Actions that cannot be undone</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleClearData} className="w-full">
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>This action will permanently delete all data. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClearData}>
              Yes, I'm Sure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSecondConfirmDialogOpen} onOpenChange={setIsSecondConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Final Confirmation</DialogTitle>
            <DialogDescription>
              Are you ABSOLUTELY sure you want to delete ALL data? This action CANNOT be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSecondConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={finalConfirmClearData}>
              Yes, Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data from File</DialogTitle>
            <DialogDescription>
              Select a JSON file to import data. This will replace all existing data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input type="file" accept=".json" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            {selectedFile && <p className="text-sm text-muted-foreground">Selected file: {selectedFile.name}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportFromFile} disabled={!selectedFile}>
              Import Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

