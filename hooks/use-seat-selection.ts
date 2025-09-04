"use client"

import { useState, useEffect, useCallback } from "react"
import type { SelectedSeat, SeatSelection } from "@/types/venue"
import { getPriceForTier } from "@/lib/venue-data"
import { websocketService } from "@/lib/websocket-service"

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
      const savedSelection = localStorage.getItem(STORAGE_KEY)
      if (savedSelection) {
        const parsedSelection: SeatSelection = JSON.parse(savedSelection)
        // Validate the parsed data structure
        if (parsedSelection.seats && Array.isArray(parsedSelection.seats)) {
          setSelection(parsedSelection)
        }
      }
    } catch (error) {
      console.warn("Failed to load seat selection from localStorage:", error)
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Save to localStorage whenever selection changes
  useEffect(() => {
    try {
      if (selection.seats.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selection))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.warn("Failed to save seat selection to localStorage:", error)
    }
  }, [selection])

  const toggleSeat = useCallback((seat: SelectedSeat) => {
    setSelection((prev) => {
      const isSelected = prev.seats.some((s) => s.id === seat.id)

      if (isSelected) {
        // Remove seat
        const newSeats = prev.seats.filter((s) => s.id !== seat.id)
        setRecentlySelected((recent) => recent.filter((id) => id !== seat.id))

        // Send WebSocket message
        websocketService.sendSeatSelection(seat.id, false)

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

        // Send WebSocket message
        websocketService.sendSeatSelection(seat.id, true)

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
    // Clear from localStorage
    localStorage.removeItem(STORAGE_KEY)
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
