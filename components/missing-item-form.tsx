"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { MissingItem } from "@/types/items"
import { generateRandomColor } from "@/lib/utils"
import { addMissingItem } from "@/lib/storage"
import GDPRNotice from "./gdpr-notice"

interface MissingItemFormProps {
  onComplete: () => void
}

export default function MissingItemForm({ onComplete }: MissingItemFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    description: "",
    lastLocation: "",
    reportedBy: "",
    phoneNumber: "",
    logger: "",
  })

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.description ||
      !formData.lastLocation ||
      !formData.reportedBy ||
      !formData.phoneNumber ||
      !formData.logger
    ) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const newMissingItem: Omit<MissingItem, "itemNumber"> = {
      id: Date.now().toString(),
      ...formData,
      timestamp: new Date().toISOString(),
      status: "missing",
    }

    try {
      const item = await addMissingItem(newMissingItem)

      toast({
        title: "Success",
        description: `Missing item reported successfully with number ${item.itemNumber}`,
      })

      onComplete()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report missing item",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter detailed description of the missing item"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastLocation">Last Known Location</Label>
          <Input
            id="lastLocation"
            name="lastLocation"
            value={formData.lastLocation}
            onChange={handleChange}
            placeholder="Enter where the item was last seen"
          />
        </div>

        <GDPRNotice />

        <div className="space-y-2">
          <Label htmlFor="reportedBy">Reported By</Label>
          <Input
            id="reportedBy"
            name="reportedBy"
            value={formData.reportedBy}
            onChange={handleChange}
            placeholder="Enter name of person reporting the item missing"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Enter contact phone number"
            type="tel"
          />
        </div>

        <div className="space-y-2">
          <Label>Logged by</Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {loggers.map((logger) => (
              <Button
                key={logger}
                type="button"
                variant={formData.logger === logger ? "default" : "outline"}
                style={{
                  backgroundColor: formData.logger === logger ? loggerColors[logger] : "",
                  color: formData.logger === logger ? "#fff" : "",
                  borderColor: formData.logger === logger ? loggerColors[logger] : "",
                }}
                onClick={() => setFormData((prev) => ({ ...prev, logger }))}
              >
                {logger}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Report Missing Item
      </Button>
    </form>
  )
}

