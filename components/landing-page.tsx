"use client"

import { Button } from "@/components/ui/button"
import { CreditCardIcon as IdCardIcon, Gem, CheckCircleIcon, AlertTriangleIcon } from "lucide-react"

interface LandingPageProps {
  onLogItemClick: () => void
  setActiveTab: (tab: string) => void
}

export default function LandingPage({ onLogItemClick, setActiveTab }: LandingPageProps) {
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
    {
      id: "returned-items-log",
      label: "Reunited Items",
      icon: <CheckCircleIcon className="h-5 w-5 mr-2" />,
      borderColor: "border-green-600", // Green border for Reunited Items
    },
  ]

  return (
    <div className="flex flex-col items-center space-y-8">
      <Button
        onClick={onLogItemClick}
        className="w-full max-w-md py-6 text-2xl font-medium bg-blue-600 hover:bg-blue-700 shadow-lg rounded-xl transition-all hover:shadow-xl hover:translate-y-[-2px]"
      >
        Log New Item
      </Button>

      <div className="w-full">
        <h2 className="text-lg font-medium mb-4">View Logs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {logButtons.map((button) => (
            <Button
              key={button.id}
              variant="outline"
              onClick={() => setActiveTab(button.id)}
              className={`flex items-center justify-center py-6 text-lg border-2 ${button.borderColor}`}
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

