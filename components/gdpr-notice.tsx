import { AlertCircleIcon } from "lucide-react"

export default function GDPRNotice() {
  return (
    <div className="bg-orange-50 p-3 rounded-md flex items-start mt-4 mb-2">
      <AlertCircleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-blue-700">
        <strong>Data Protection Reminder: </strong>
        Obtain verbal consent to record personal information.
      </p>
    </div>
  )
}

