"use client"

import { Button } from "@/components/ui/button"
import { CreditCardIcon as IdCardIcon, Gem, AlertTriangleIcon } from "lucide-react"

interface LogSelectionProps {
  onBack: () => void
  setActiveTab: (tab: string) => void
}

export default function LogSelection({ onBack, setActiveTab }: LogSelectionProps) {
  const logOptions = [
    {
      id: "lapel-badge-form",
      label: "Log Lapel Badge",
      icon: <IdCardIcon className="h-5 w-5 mr-2" />,
      color: "bg-teal-600 hover:bg-teal-700",
    },
    {
      id: "high-value-item-form",
      label: "Log High Value Item",
      icon: <Gem className="h-5 w-5 mr-2" />,
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      id: "report-missing",
      label: "Reported Missing",
      icon: <AlertTriangleIcon className="h-5 w-5 mr-2" />,
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ]

  const logButtons = [
    {
      id: "lapel-badge-log",
      label: "Lapel Badge Log",
      icon: <IdCardIcon className="h-5 w-5 mr-2" />,
      borderColor: "border-teal-600", // Teal border for Lapel Badge
    },
    {
      id: "high-value-items-log",
      label: "High-Value Items Log",
      icon: <Gem className="h-5 w-5 mr-2" />,
      borderColor: "border-purple-600", // Purple border for High-Value Items
    },
    {
      id: "missing-items-log",
      label: "Missing Items Log",
      icon: <AlertTriangleIcon className="h-5 w-5 mr-2" />,
      borderColor: "border-orange-600", // Orange border for Missing Items
    },
  ]

  return (
    <div className="flex flex-col space-y-8">
      <Button variant="ghost" onClick={onBack} className="self-start">
        ← Back
      </Button>

      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4">Select Item Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {logOptions.map((option) => (
            <Button
              key={option.id}
              onClick={() => setActiveTab(option.id)}
              className={`flex items-center justify-center py-8 text-lg text-white ${option.color}`}
            >
              {option.icon}
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="w-full pt-4 border-t">
        <h2 className="text-lg font-medium mb-4">View Logs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {logButtons.map((button) => (
            <Button
              key={button.id}
              variant="outline"
              onClick={() => setActiveTab(button.id)}
              className={`flex items-center justify-center py-4 border-2 ${button.borderColor}`}
            >
              {button.icon}
              {button.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

