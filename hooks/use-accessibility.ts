"use client"

import { useState, useEffect, useCallback } from "react"

export function useAccessibility() {
  const [announcements, setAnnouncements] = useState<string>("")
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    // Check for high contrast preference
    const mediaQuery = window.matchMedia("(prefers-contrast: high)")
    setHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const announce = useCallback((message: string) => {
    setAnnouncements(message)
  }, [])

  const announceSelection = useCallback(
    (seatId: string, action: "selected" | "deselected") => {
      const message = `Seat ${seatId} ${action}`
      announce(message)
    },
    [announce],
  )

  const announceStatusChange = useCallback(
    (seatId: string, newStatus: string) => {
      const message = `Seat ${seatId} status changed to ${newStatus}`
      announce(message)
    },
    [announce],
  )

  return {
    announcements,
    prefersReducedMotion,
    highContrast,
    announce,
    announceSelection,
    announceStatusChange,
  }
}
