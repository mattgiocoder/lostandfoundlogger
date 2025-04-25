"use client"

import { useEffect, useRef } from "react"

export function useAutoLock(isLoggedIn: boolean, onLock: () => void) {
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inactivityTimeoutMinutes = 3 // Changed from 10 to 3 minutes

  const resetLockTimeout = () => {
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current)
    }

    if (isLoggedIn) {
      lockTimeoutRef.current = setTimeout(
        () => {
          onLock()
        },
        inactivityTimeoutMinutes * 60 * 1000,
      )
    }
  }

  useEffect(() => {
    // Set up event listeners for user activity
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]

    const handleUserActivity = () => {
      resetLockTimeout()
    }

    // Initial setup
    resetLockTimeout()

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity)
    })

    // Cleanup
    return () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current)
      }

      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })
    }
  }, [isLoggedIn, onLock])

  return null
}

