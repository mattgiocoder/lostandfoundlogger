"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { ReturnedItem } from "@/types/items"
import { undoReunite, exportDataAsPDF } from "@/lib/storage"
import { formatDate } from "@/lib/utils"
import { SearchIcon, CheckCircleIcon, UndoIcon, HomeIcon, FileTextIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { storageManager } from "@/lib/storage/storage-manager"

interface ReturnedItemsLogProps {
  onBackToMain?: () => void
  setActiveTab: (tab: string) => void
}

export default function ReturnedItemsLog({ onBackToMain, setActiveTab }: ReturnedItemsLogProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<ReturnedItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTabState] = useState("all")
  const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ReturnedItem | null>(null)

  useEffect(() => {
    const loadItems = async () => {
      try {
        const storedItems = await storageManager.getReunitedItems()
        setItems(storedItems)
      } catch (error) {
        console.error("Error loading reunited items:", error)
        toast({
          title: "Error",
          description: "Failed to load reunited items",
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

  const filteredItems = items.filter((item) => {
    // Filter by type if not "all"
    if (activeTab !== "all" && item.type !== activeTab) {
      return false
    }

    // Filter by search term
    const searchFields = [
      item.type === "lapel-badge" ? (item.originalItem as any).name : "",
      item.type === "lapel-badge" ? (item.originalItem as any).congregation : "",
      item.type === "high-value" ? (item.originalItem as any).category : "",
      item.type === "high-value" ? (item.originalItem as any).description : "",
      item.recipientName,
      item.returnedBy,
      (item.originalItem as any).itemNumber,
    ]

    return searchFields.some((field) => field && field.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const handleUndoReturn = (item: ReturnedItem) => {
    setSelectedItem(item)
    setIsUndoDialogOpen(true)
  }

  const confirmUndoReturn = async () => {
    if (!selectedItem) return

    try {
      await undoReunite(selectedItem.id)

      toast({
        title: "Success",
        description: "Reunite action has been undone",
      })

      setIsUndoDialogOpen(false)

      // Refresh the list
      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id))

      // Redirect to the appropriate log page based on the item type
      setTimeout(() => {
        if (selectedItem.type === "lapel-badge") {
          setActiveTab("lapel-badge-log")
        } else if (selectedItem.type === "high-value") {
          setActiveTab("high-value-items-log")
        } else if (selectedItem.type === "missing") {
          setActiveTab("missing-items-log")
        }

        setSelectedItem(null)
      }, 500)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to undo reunite action",
        variant: "destructive",
      })
    }
  }

  const handleExport = () => {
    exportDataAsPDF("returned")
    toast({
      title: "Success",
      description: "Reunited items exported as PDF",
    })
  }

  return (
    <div className="space-y-6">
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
          <CheckCircleIcon className="h-6 w-6 mr-2" /> Reunited Items Log
        </h2>
        <div className="relative w-64">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reunited items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTabState}>
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="lapel-badge">Lapel Badges</TabsTrigger>
          <TabsTrigger value="high-value">High-Value Items</TabsTrigger>
          <TabsTrigger value="missing">Missing Items</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No reunited items found</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Item #</TableHead>
                <TableHead>Item Type</TableHead>
                <TableHead>Item Details</TableHead>
                <TableHead>Reunited With</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Reunited By</TableHead>
                <TableHead>Reunite Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <CheckCircleIcon className="h-7 w-7 text-green-500" />
                  </TableCell>
                  <TableCell className="font-medium">{(item.originalItem as any).itemNumber}</TableCell>
                  <TableCell>
                    {item.type === "lapel-badge"
                      ? "Lapel Badge"
                      : item.type === "high-value"
                        ? "High-Value Item"
                        : "Missing Item"}
                  </TableCell>
                  <TableCell>
                    {item.type === "lapel-badge" ? (
                      <span>
                        {(item.originalItem as any).name} ({(item.originalItem as any).congregation})
                      </span>
                    ) : item.type === "high-value" ? (
                      <span>
                        {(item.originalItem as any).category}: {(item.originalItem as any).description}
                      </span>
                    ) : (
                      <span>{(item.originalItem as any).description}</span>
                    )}
                  </TableCell>
                  <TableCell>{item.recipientName}</TableCell>
                  <TableCell>{item.phoneNumber}</TableCell>
                  <TableCell>{item.returnedBy}</TableCell>
                  <TableCell>{formatDate(item.returnTimestamp)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUndoReturn(item)}
                      className="flex items-center text-amber-600 border-amber-600 hover:bg-amber-50 py-0 px-2 h-7 text-xs"
                    >
                      <UndoIcon className="h-3 w-3 mr-1" />
                      Undo
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo Reunite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Are you sure you want to undo this reunite action? The item will be moved back to its original log.</p>
            <div className="space-y-2">
              <p>
                <strong>Item #:</strong> {(selectedItem?.originalItem as any)?.itemNumber}
              </p>
              <p>
                <strong>Item Details:</strong>{" "}
                {selectedItem?.type === "lapel-badge"
                  ? `${(selectedItem.originalItem as any).name} (${(selectedItem.originalItem as any).congregation})`
                  : selectedItem?.type === "high-value"
                    ? `${(selectedItem.originalItem as any).category}: ${(selectedItem.originalItem as any).description}`
                    : (selectedItem?.originalItem as any)?.description}
              </p>
              <p>
                <strong>Reunited With:</strong> {selectedItem?.recipientName}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUndoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmUndoReturn} className="bg-amber-600 hover:bg-amber-700">
              Confirm Undo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

