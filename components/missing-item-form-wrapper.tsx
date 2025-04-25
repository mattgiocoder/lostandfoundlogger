"use client"

import { Button } from "@/components/ui/button"
import MissingItemForm from "./missing-item-form"

interface MissingItemFormWrapperProps {
  onBack: () => void
  onComplete: () => void
}

export default function MissingItemFormWrapper({ onBack, onComplete }: MissingItemFormWrapperProps) {
  return (
    <div>
      <Button variant="ghost" className="mb-4" onClick={onBack}>
        ← Back
      </Button>
      <h2 className="text-xl font-semibold mb-4">Reported Missing Item</h2>
      <MissingItemForm onComplete={onComplete} />
    </div>
  )
}

