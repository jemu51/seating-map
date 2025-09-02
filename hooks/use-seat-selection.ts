"use client"

import { useState, useEffect, useCallback } from "react"
import type { SelectedSeat, SeatSelection } from "@/types/venue"
import { getPriceForTier } from "@/lib/venue-data"

const STORAGE_KEY = "seating-map-selection"
const MAX_SEATS = 8

export function useSeatSelection() {
  const [selection, setSelection] = useState<SeatSelection>({
    seats: [],
    subtotal: 0,
  })
  const [recentlySelected, setRecentlySelected] = useState<string[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSelection(parsed)
      }
    } catch (error) {
      console.error("Error loading saved selection:", error)
    }
  }, [])

  // Save to localStorage whenever selection changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection))
    } catch (error) {
      console.error("Error saving selection:", error)
    }
  }, [selection])

  const toggleSeat = useCallback((seat: SelectedSeat) => {
    setSelection((prev) => {
      const isSelected = prev.seats.some((s) => s.id === seat.id)

      if (isSelected) {
        // Remove seat
        const newSeats = prev.seats.filter((s) => s.id !== seat.id)
        setRecentlySelected((recent) => recent.filter((id) => id !== seat.id))
        return {
          seats: newSeats,
          subtotal: newSeats.reduce((sum, s) => sum + getPriceForTier(s.priceTier), 0),
        }
      } else {
        // Add seat if under limit
        if (prev.seats.length >= MAX_SEATS) {
          return prev // Don't add if at max
        }

        const newSeats = [...prev.seats, seat]
        setRecentlySelected((recent) => [...recent.slice(-2), seat.id])
        return {
          seats: newSeats,
          subtotal: newSeats.reduce((sum, s) => sum + getPriceForTier(s.priceTier), 0),
        }
      }
    })
  }, [])

  const selectMultipleSeats = useCallback((seats: SelectedSeat[]) => {
    setSelection((prev) => {
      // Filter out seats that would exceed the limit
      const availableSlots = MAX_SEATS - prev.seats.length
      const seatsToAdd = seats.slice(0, availableSlots).filter((seat) => !prev.seats.some((s) => s.id === seat.id))

      if (seatsToAdd.length === 0) {
        return prev
      }

      const newSeats = [...prev.seats, ...seatsToAdd]
      setRecentlySelected(seatsToAdd.map((seat) => seat.id))

      return {
        seats: newSeats,
        subtotal: newSeats.reduce((sum, s) => sum + getPriceForTier(s.priceTier), 0),
      }
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelection({ seats: [], subtotal: 0 })
    setRecentlySelected([])
  }, [])

  const isSeatSelected = useCallback(
    (seatId: string) => {
      return selection.seats.some((s) => s.id === seatId)
    },
    [selection.seats],
  )

  const isSeatRecentlySelected = useCallback(
    (seatId: string) => {
      return recentlySelected.includes(seatId)
    },
    [recentlySelected],
  )

  const canSelectMore = selection.seats.length < MAX_SEATS

  const canSelectSeat = useCallback(
    (seat: SelectedSeat) => {
      if (seat.status !== "available") {
        return { canSelect: false, reason: "Seat is not available" }
      }
      if (isSeatSelected(seat.id)) {
        return { canSelect: true, reason: "Can deselect" }
      }
      if (!canSelectMore) {
        return { canSelect: false, reason: `Maximum ${MAX_SEATS} seats allowed` }
      }
      return { canSelect: true, reason: "Can select" }
    },
    [isSeatSelected, canSelectMore],
  )

  return {
    selection,
    toggleSeat,
    selectMultipleSeats,
    clearSelection,
    isSeatSelected,
    isSeatRecentlySelected,
    canSelectMore,
    canSelectSeat,
    maxSeats: MAX_SEATS,
  }
}
