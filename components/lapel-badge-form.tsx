"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { LapelBadge } from "@/types/items"
import { generateRandomColor } from "@/lib/utils"
import { addLapelBadge } from "@/lib/storage"

interface LapelBadgeFormProps {
  onComplete: () => void
}

export default function LapelBadgeForm({ onComplete }: LapelBadgeFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    congregation: "",
    whereFound: "",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.congregation || !formData.whereFound || !formData.logger) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const newLapelBadge: Omit<LapelBadge, "itemNumber"> = {
      id: Date.now().toString(),
      ...formData,
      timestamp: new Date().toISOString(),
      status: "found",
    }

    try {
      const badge = await addLapelBadge(newLapelBadge)

      toast({
        title: "Success",
        description: `Lapel badge logged successfully with number ${badge.itemNumber}`,
      })

      onComplete()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log lapel badge",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name on Badge</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter name on badge"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="congregation">Congregation</Label>
            <Input
              id="congregation"
              name="congregation"
              value={formData.congregation}
              onChange={handleChange}
              placeholder="Enter congregation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whereFound">Where Found</Label>
            <Input
              id="whereFound"
              name="whereFound"
              value={formData.whereFound}
              onChange={handleChange}
              placeholder="Enter where the badge was found"
            />
          </div>
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
        Submit Lapel Badge
      </Button>
    </form>
  )
}

