"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { LapelBadge } from "@/types/items"
import { markItemReunited, exportDataAsPDF } from "@/lib/storage"
import { formatDate, generateRandomColor } from "@/lib/utils"
import { SearchIcon, CheckCircleIcon, HomeIcon, FileTextIcon, CreditCardIcon as IdCardIcon } from "lucide-react"
import GDPRNotice from "./gdpr-notice"
import { storageManager } from "@/lib/storage/storage-manager"
import ReunificationNotification from "./reunification-notification"

interface LapelBadgeLogProps {
  onBackToMain?: () => void
  setActiveTab: (tab: string) => void
}

export default function LapelBadgeLog({ onBackToMain, setActiveTab }: LapelBadgeLogProps) {
  const { toast } = useToast()
  const [badges, setBadges] = useState<LapelBadge[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<LapelBadge | null>(null)
  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [returnerName, setReturnerName] = useState("")
  const [showReunificationNotification, setShowReunificationNotification] = useState(false)

  const loggers = [
    "Matt",
    "Jamie",
    "Saul",
    "Charlie",
    "David",
    "Mel",
    "Michael",
    "Candice",
    "Joe",
    "Esther",
    "Eric",
    "Hannah",
  ]

  // Generate random colors for logger buttons
  const loggerColors = loggers.reduce(
    (acc, logger) => {
      acc[logger] = generateRandomColor()
      return acc
    },
    {} as Record<string, string>,
  )

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const storedBadges = await storageManager.getLapelBadges()
        setBadges(storedBadges.filter((badge) => badge.status === "found"))
      } catch (error) {
        console.error("Error loading lapel badges:", error)
        toast({
          title: "Error",
          description: "Failed to load lapel badges",
          variant: "destructive",
        })
      }
    }

    loadBadges()

    // Set up event listener for storage changes
    const handleStorageUpdate = () => {
      loadBadges()
    }

    window.addEventListener("storage-updated", handleStorageUpdate)

    return () => {
      window.removeEventListener("storage-updated", handleStorageUpdate)
    }
  }, [toast])

  const filteredBadges = badges.filter(
    (badge) =>
      badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.congregation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.whereFound.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.logger.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.itemNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleReturn = (badge: LapelBadge) => {
    setSelectedBadge(badge)
    setIsReturnDialogOpen(true)
    setReturnerName("")
    setRecipientName("")
    setRecipientPhone("")
  }

  const confirmReturn = async () => {
    if (!selectedBadge || !recipientName || !recipientPhone || !returnerName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a clean copy of the badge without any potential circular references
      const cleanBadge = {
        id: selectedBadge.id,
        itemNumber: selectedBadge.itemNumber,
        name: selectedBadge.name,
        congregation: selectedBadge.congregation,
        whereFound: selectedBadge.whereFound,
        logger: selectedBadge.logger,
        timestamp: selectedBadge.timestamp,
        status: selectedBadge.status,
      }

      await markItemReunited(cleanBadge.id, "lapel-badge", recipientName, recipientPhone, returnerName)

      // Close the dialog
      setIsReturnDialogOpen(false)
      setRecipientName("")
      setRecipientPhone("")
      setReturnerName("")
      setSelectedBadge(null)

      // Refresh the list
      setBadges((prev) => prev.filter((badge) => badge.id !== cleanBadge.id))

      // Show the reunification notification
      setShowReunificationNotification(true)

      // Redirect to the reunited items page after notification
      setTimeout(() => {
        setActiveTab("returned-items-log")
      }, 2000)
    } catch (error) {
      console.error("Error reuniting item:", error)
      toast({
        title: "Error",
        description: "Failed to reunite item",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    exportDataAsPDF("lapel-badge")
    toast({
      title: "Success",
      description: "Lapel badges exported as PDF",
    })
  }

  return (
    <div className="space-y-6">
      <ReunificationNotification
        show={showReunificationNotification}
        onHide={() => setShowReunificationNotification(false)}
      />

      <div className="flex items-center justify-between">
        {onBackToMain && (
          <Button variant="outline" onClick={onBackToMain} className="flex items-center">
            <HomeIcon className="h-4 w-4 mr-2" />
            Back to Main
          </Button>
        )}

        <Button variant="outline" onClick={handleExport} className="flex items-center ml-auto">
          <FileTextIcon className="h-4 w-4 mr-2" />
          Export Log
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <IdCardIcon className="h-6 w-6 mr-2" /> Lapel Badge Log
        </h2>
        <div className="relative w-64">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search badges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {filteredBadges.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No lapel badges found</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Congregation</TableHead>
                <TableHead>Where Found</TableHead>
                <TableHead>Logged By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBadges.map((badge) => (
                <TableRow key={badge.id}>
                  <TableCell className="font-medium">{badge.itemNumber}</TableCell>
                  <TableCell>{badge.name}</TableCell>
                  <TableCell>{badge.congregation}</TableCell>
                  <TableCell>{badge.whereFound}</TableCell>
                  <TableCell>{badge.logger}</TableCell>
                  <TableCell>{formatDate(badge.timestamp)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReturn(badge)}
                      className="flex items-center text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Reunite
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reunite Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p>
                <strong>Item #:</strong> {selectedBadge?.itemNumber}
              </p>
              <p>
                <strong>Name:</strong> {selectedBadge?.name}
              </p>
              <p>
                <strong>Congregation:</strong> {selectedBadge?.congregation}
              </p>
            </div>

            <GDPRNotice />

            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter name of person receiving the item"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientPhone">Recipient Phone</Label>
              <Input
                id="recipientPhone"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="Enter phone number of recipient"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label>Reunited By</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {loggers.map((logger) => (
                  <Button
                    key={logger}
                    type="button"
                    variant={returnerName === logger ? "default" : "outline"}
                    style={{
                      backgroundColor: returnerName === logger ? loggerColors[logger] : "",
                      color: returnerName === logger ? "#fff" : "",
                      borderColor: returnerName === logger ? loggerColors[logger] : "",
                    }}
                    onClick={() => setReturnerName(logger)}
                  >
                    {logger}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmReturn} className="bg-green-600 hover:bg-green-700">
              Confirm Reunite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

