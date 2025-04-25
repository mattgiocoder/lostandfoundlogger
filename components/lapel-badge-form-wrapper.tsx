"use client"

import { Button } from "@/components/ui/button"
import LapelBadgeForm from "./lapel-badge-form"

interface LapelBadgeFormWrapperProps {
  onBack: () => void
  onComplete: () => void
}

export default function LapelBadgeFormWrapper({ onBack, onComplete }: LapelBadgeFormWrapperProps) {
  return (
    <div>
      <Button variant="ghost" className="mb-4" onClick={onBack}>
        ← Back
      </Button>
      <h2 className="text-xl font-semibold mb-4">Log Lapel Badge</h2>
      <LapelBadgeForm onComplete={onComplete} />
    </div>
  )
}

