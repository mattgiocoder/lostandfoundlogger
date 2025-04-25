"use client"

import { Button } from "@/components/ui/button"
import { PlusCircleIcon, CreditCardIcon as IdCardIcon, Gem, CheckCircleIcon, AlertTriangleIcon } from "lucide-react"

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const tabs = [
    { id: "log-item", label: "Log Item", icon: <PlusCircleIcon className="h-5 w-5 mr-2" /> },
    { id: "lapel-badge-log", label: "Lapel Badge Log", icon: <IdCardIcon className="h-5 w-5 mr-2" /> },
    { id: "high-value-items-log", label: "High-Value Items Log", icon: <Gem className="h-5 w-5 mr-2" /> },
    { id: "missing-items-log", label: "Missing Items Log", icon: <AlertTriangleIcon className="h-5 w-5 mr-2" /> },
    { id: "report-missing", label: "Reported Missing", icon: <AlertTriangleIcon className="h-5 w-5 mr-2" /> },
    { id: "returned-items-log", label: "Reunited Items", icon: <CheckCircleIcon className="h-5 w-5 mr-2" /> },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? "default" : "outline"}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center ${tab.id === "log-item" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
        >
          {tab.icon}
          {tab.label}
        </Button>
      ))}
    </div>
  )
}

