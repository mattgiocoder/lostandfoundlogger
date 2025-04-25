"use client"

import { useEffect } from "react"
import { CheckCircleIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ReunificationNotificationProps {
  show: boolean
  onHide: () => void
}

export default function ReunificationNotification({ show, onHide }: ReunificationNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [show, onHide])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-300 rounded-lg shadow-lg px-6 py-4 flex items-center"
        >
          <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">Item Reunited</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

