"use client"

import { useEffect, useState, useCallback } from "react"
import { websocketService, type WebSocketMessage, type SeatStatusUpdate } from "@/lib/websocket-service"
import type { Venue, SeatStatus } from "@/types/venue"

export function useWebSocketUpdates(venue: Venue | null) {
  const [seatUpdates, setSeatUpdates] = useState<Map<string, SeatStatus>>(new Map())
  const [animatingSeats, setAnimatingSeats] = useState<Set<string>>(new Set())
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected")

  const handleSeatUpdate = useCallback((update: SeatStatusUpdate) => {
    console.log("[WebSocket] Seat update:", update)

    // Add to animating seats for visual feedback
    setAnimatingSeats((prev) => new Set(prev).add(update.seatId))

    // Update seat status
    setSeatUpdates((prev) => new Map(prev).set(update.seatId, update.status))

    // Remove from animating after animation duration
    setTimeout(() => {
      setAnimatingSeats((prev) => {
        const next = new Set(prev)
        next.delete(update.seatId)
        return next
      })
    }, 1000) // Match CSS animation duration
  }, [])

  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case "seat_update":
          if (message.data && !Array.isArray(message.data)) {
            handleSeatUpdate(message.data)
          }
          break
        case "bulk_update":
          if (message.data && Array.isArray(message.data)) {
            message.data.forEach(handleSeatUpdate)
          }
          break
        case "heartbeat":
          console.log("[WebSocket] Heartbeat received")
          break
      }
    },
    [handleSeatUpdate],
  )

  useEffect(() => {
    if (!venue) return

    console.log("[WebSocket] Starting connection...")
    setConnectionStatus("connecting")

    const unsubscribe = websocketService.subscribe(handleWebSocketMessage)
    websocketService.connect()

    // Update connection status
    const checkStatus = () => {
      setConnectionStatus(websocketService.getConnectionState())
    }

    const statusInterval = setInterval(checkStatus, 1000)

    return () => {
      unsubscribe()
      clearInterval(statusInterval)
      websocketService.disconnect()
      setConnectionStatus("disconnected")
    }
  }, [venue, handleWebSocketMessage])

  const getSeatStatus = useCallback(
    (seatId: string, originalStatus: SeatStatus): SeatStatus => {
      return seatUpdates.get(seatId) || originalStatus
    },
    [seatUpdates],
  )

  const isSeatAnimating = useCallback(
    (seatId: string): boolean => {
      return animatingSeats.has(seatId)
    },
    [animatingSeats],
  )

  return {
    getSeatStatus,
    isSeatAnimating,
    connectionStatus,
    updateCount: seatUpdates.size,
  }
}
