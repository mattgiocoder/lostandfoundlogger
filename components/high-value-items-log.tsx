"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { HighValueItem } from "@/types/items"
import { markItemReunited, exportDataAsPDF } from "@/lib/storage"
import { formatDate, generateRandomColor } from "@/lib/utils"
import { SearchIcon, Gem, CheckCircleIcon, HomeIcon, FileTextIcon } from "lucide-react"
import GDPRNotice from "./gdpr-notice"
import ReunificationNotification from "./reunification-notification"

// Make sure to import the storageManager
import { storageManager } from "@/lib/storage/storage-manager"

interface HighValueItemsLogProps {
  onBackToMain?: () => void
  setActiveTab: (tab: string) => void
}

export default function HighValueItemsLog({ onBackToMain, setActiveTab }: HighValueItemsLogProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<HighValueItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<HighValueItem | null>(null)
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

  // Update the useEffect hook to load high-value items from the storage manager

  useEffect(() => {
    const loadItems = async () => {
      try {
        const storedItems = await storageManager.getHighValueItems()
        setItems(storedItems.filter((item) => item.status === "found"))
      } catch (error) {
        console.error("Error loading high-value items:", error)
        toast({
          title: "Error",
          description: "Failed to load high-value items",
          variant: "destructive",
        })
      }
    }

    loadItems()

    // Set up event listener for storage changes
    const handleStorageUpdate = () => {
      loadItems()
    }

    window.addEventListener("storage-updated", handleStorageUpdate)

    return () => {
      window.removeEventListener("storage-updated", handleStorageUpdate)
    }
  }, [toast])

  const filteredItems = items.filter(
    (item) =>
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.whereFound.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.logger.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleReturn = (item: HighValueItem) => {
    setSelectedItem(item)
    setIsReturnDialogOpen(true)
    setReturnerName("")
    setRecipientName("")
    setRecipientPhone("")
  }

  const confirmReturn = async () => {
    if (!selectedItem || !recipientName || !recipientPhone || !returnerName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      // Create a clean copy of the item without any potential circular references
      const cleanItem = {
        id: selectedItem.id,
        itemNumber: selectedItem.itemNumber,
        category: selectedItem.category,
        description: selectedItem.description,
        whereFound: selectedItem.whereFound,
        logger: selectedItem.logger,
        timestamp: selectedItem.timestamp,
        status: selectedItem.status,
      }

      await markItemReunited(cleanItem.id, "high-value", recipientName, recipientPhone, returnerName)

      // Close the dialog
      setIsReturnDialogOpen(false)
      setRecipientName("")
      setRecipientPhone("")
      setReturnerName("")
      setSelectedItem(null)

      // Refresh the list
      setItems((prev) => prev.filter((item) => item.id !== cleanItem.id))

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
    exportDataAsPDF("high-value")
    toast({
      title: "Success",
      description: "High-value items exported as PDF",
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
          <Gem className="h-6 w-6 mr-2" /> High-Value Items Log
        </h2>
        <div className="relative w-64">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No high-value items found</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item #</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Where Found</TableHead>
                <TableHead>Logged By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemNumber}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.whereFound}</TableCell>
                  <TableCell>{item.logger}</TableCell>
                  <TableCell>{formatDate(item.timestamp)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReturn(item)}
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
                <strong>Item #:</strong> {selectedItem?.itemNumber}
              </p>
              <p>
                <strong>Category:</strong> {selectedItem?.category}
              </p>
              <p>
                <strong>Description:</strong> {selectedItem?.description}
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

