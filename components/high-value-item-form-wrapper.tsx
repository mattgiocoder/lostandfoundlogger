"use client"

import { Button } from "@/components/ui/button"
import HighValueItemForm from "./high-value-item-form"

interface HighValueItemFormWrapperProps {
  onBack: () => void
  onComplete: () => void
}

export default function HighValueItemFormWrapper({ onBack, onComplete }: HighValueItemFormWrapperProps) {
  return (
    <div>
      <Button variant="ghost" className="mb-4" onClick={onBack}>
        ← Back
      </Button>
      <h2 className="text-xl font-semibold mb-4">Log High Value Item</h2>
      <HighValueItemForm onComplete={onComplete} />
    </div>
  )
}

