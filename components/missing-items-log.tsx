"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { MissingItem } from "@/types/items"
import { markMissingItemAsFound, exportDataAsPDF } from "@/lib/storage"
import { formatDate } from "@/lib/utils"
import { SearchIcon, CheckCircleIcon, HomeIcon, FileTextIcon, AlertTriangleIcon } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { storageManager } from "@/lib/storage/storage-manager"

interface MissingItemsLogProps {
  onBackToMain?: () => void
  setActiveTab: (tab: string) => void
}

export default function MissingItemsLog({ onBackToMain, setActiveTab }: MissingItemsLogProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<MissingItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isFoundDialogOpen, setIsFoundDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MissingItem | null>(null)
  const [foundType, setFoundType] = useState<"lapel-badge" | "high-value">("high-value")
  const [additionalData, setAdditionalData] = useState({
    name: "",
    congregation: "",
    category: "",
    whereFound: "",
  })

  useEffect(() => {
    const loadItems = async () => {
      try {
        const storedItems = await storageManager.getMissingItems()
        setItems(storedItems)
      } catch (error) {
        console.error("Error loading missing items:", error)
        toast({
          title: "Error",
          description: "Failed to load missing items",
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
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lastLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reportedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.logger.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleMarkAsFound = (item: MissingItem) => {
    setSelectedItem(item)
    setIsFoundDialogOpen(true)
  }

  const confirmMarkAsFound = async () => {
    if (!selectedItem) return

    if (
      foundType === "lapel-badge" &&
      (!additionalData.name || !additionalData.congregation || !additionalData.whereFound)
    ) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (foundType === "high-value" && (!additionalData.category || !additionalData.whereFound)) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      await markMissingItemAsFound(selectedItem.id, foundType, additionalData)

      toast({
        title: "Success",
        description: "Item marked as handed in and added to the appropriate log",
      })

      setIsFoundDialogOpen(false)
      setAdditionalData({
        name: "",
        congregation: "",
        category: "",
        whereFound: "",
      })
      setSelectedItem(null)

      // Refresh the list
      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id))

      // Redirect to the appropriate log
      setTimeout(() => {
        if (foundType === "lapel-badge") {
          setActiveTab("lapel-badge-log")
        } else {
          setActiveTab("high-value-items-log")
        }
      }, 500)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark item as found",
        variant: "destructive",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAdditionalData((prev) => ({ ...prev, [name]: value }))
  }

  const handleExport = () => {
    exportDataAsPDF("missing")
    toast({
      title: "Success",
      description: "Missing items exported as PDF",
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
          <AlertTriangleIcon className="h-6 w-6 mr-2" /> Missing Items Log
        </h2>
        <div className="relative w-64">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search missing items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No missing items reported</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item #</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Last Location</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemNumber}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.lastLocation}</TableCell>
                  <TableCell>{item.reportedBy}</TableCell>
                  <TableCell>{item.phoneNumber}</TableCell>
                  <TableCell>{formatDate(item.timestamp)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsFound(item)}
                      className="flex items-center text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Handed In
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isFoundDialogOpen} onOpenChange={setIsFoundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Item as Handed In</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p>
                <strong>Description:</strong> {selectedItem?.description}
              </p>
              <p>
                <strong>Reported By:</strong> {selectedItem?.reportedBy}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Item Type</Label>
              <RadioGroup
                value={foundType}
                onValueChange={(value: "lapel-badge" | "high-value") => setFoundType(value)}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lapel-badge" id="lapel-badge" />
                  <Label htmlFor="lapel-badge">Lapel Badge</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high-value" id="high-value" />
                  <Label htmlFor="high-value">High-Value Item</Label>
                </div>
              </RadioGroup>
            </div>

            {foundType === "lapel-badge" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name on Badge</Label>
                  <Input
                    id="name"
                    name="name"
                    value={additionalData.name}
                    onChange={handleChange}
                    placeholder="Enter name on badge"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="congregation">Congregation</Label>
                  <Input
                    id="congregation"
                    name="congregation"
                    value={additionalData.congregation}
                    onChange={handleChange}
                    placeholder="Enter congregation"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  value={additionalData.category}
                  onChange={handleChange}
                  placeholder="Enter category"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="whereFound">Where Found</Label>
              <Input
                id="whereFound"
                name="whereFound"
                value={additionalData.whereFound}
                onChange={handleChange}
                placeholder="Enter where the item was found"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFoundDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmMarkAsFound} className="bg-green-600 hover:bg-green-700">
              Confirm Handed In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

