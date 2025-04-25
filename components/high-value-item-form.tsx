"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import type { HighValueItem } from "@/types/items"
import { generateRandomColor } from "@/lib/utils"
import { addHighValueItem } from "@/lib/storage"

interface HighValueItemFormProps {
  onComplete: () => void
}

export default function HighValueItemForm({ onComplete }: HighValueItemFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    whereFound: "",
    logger: "",
  })

  const categories = ["Electronics", "Money/Credit Cards", "Jewellery", "Clothing", "Wallet/Purse", "Other"]

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

    if (!formData.category || !formData.description || !formData.whereFound || !formData.logger) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const newHighValueItem: Omit<HighValueItem, "itemNumber"> = {
      id: Date.now().toString(),
      ...formData,
      timestamp: new Date().toISOString(),
      status: "found",
    }

    try {
      const item = await addHighValueItem(newHighValueItem)

      toast({
        title: "Success",
        description: `High-value item logged successfully with number ${item.itemNumber}`,
      })

      onComplete()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log high-value item",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <RadioGroup
            value={formData.category}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            className="grid grid-cols-2 gap-2"
          >
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <RadioGroupItem value={category} id={category} />
                <Label htmlFor={category}>{category}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter detailed description of the item"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whereFound">Where Found</Label>
          <Input
            id="whereFound"
            name="whereFound"
            value={formData.whereFound}
            onChange={handleChange}
            placeholder="Enter where the item was found"
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
        Submit High-Value Item
      </Button>
    </form>
  )
}

