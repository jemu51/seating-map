"use client"

import type { SeatStatus } from "@/types/venue"

export interface SeatStatusUpdate {
  seatId: string
  status: SeatStatus
  timestamp: number
}

export interface WebSocketMessage {
  type: "seat_update" | "bulk_update" | "heartbeat"
  data: SeatStatusUpdate | SeatStatusUpdate[] | null
}

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: ((message: WebSocketMessage) => void)[] = []
  private isConnecting = false

  connect(url?: string) {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return
    }

    this.isConnecting = true

    // Use mock WebSocket for demo purposes
    this.connectMockWebSocket()
  }

  private connectMockWebSocket() {
    // Simulate WebSocket connection with periodic updates
    console.log("[WebSocket] Connecting to mock server...")

    // Simulate connection delay
    setTimeout(() => {
      this.isConnecting = false
      this.reconnectAttempts = 0
      console.log("[WebSocket] Connected to mock server")

      // Start sending mock updates
      this.startMockUpdates()
    }, 1000)
  }

  private startMockUpdates() {
    // Send periodic seat status updates to simulate real-time changes
    const sendRandomUpdate = () => {
      const seatIds = ["A-1-01", "A-1-02", "A-1-03", "A-2-01", "A-2-02", "B-1-01", "B-1-02"]
      const statuses: SeatStatus[] = ["available", "reserved", "sold", "held"]

      const randomSeatId = seatIds[Math.floor(Math.random() * seatIds.length)]
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

      const update: SeatStatusUpdate = {
        seatId: randomSeatId,
        status: randomStatus,
        timestamp: Date.now(),
      }

      const message: WebSocketMessage = {
        type: "seat_update",
        data: update,
      }

      this.notifyListeners(message)
    }

    // Send updates every 3-8 seconds
    const scheduleNextUpdate = () => {
      const delay = 3000 + Math.random() * 5000
      setTimeout(() => {
        sendRandomUpdate()
        scheduleNextUpdate()
      }, delay)
    }

    scheduleNextUpdate()

    // Send heartbeat every 30 seconds
    setInterval(() => {
      const heartbeat: WebSocketMessage = {
        type: "heartbeat",
        data: null,
      }
      this.notifyListeners(heartbeat)
    }, 30000)
  }

  private notifyListeners(message: WebSocketMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(message)
      } catch (error) {
        console.error("[WebSocket] Error in listener:", error)
      }
    })
  }

  subscribe(listener: (message: WebSocketMessage) => void) {
    this.listeners.push(listener)

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners = []
    this.isConnecting = false
    console.log("[WebSocket] Disconnected")
  }

  getConnectionState() {
    if (this.isConnecting) return "connecting"
    if (this.listeners.length > 0) return "connected"
    return "disconnected"
  }
}

export const websocketService = new WebSocketService()
