"use client"

import type { SeatStatus } from "@/types/venue"

export interface SeatStatusUpdate {
  seatId: string
  status: SeatStatus
  timestamp: number
  source?: string
}

export interface WebSocketMessage {
  type: "seat_update" | "bulk_update" | "heartbeat" | "error" | "seat_selection"
  data: SeatStatusUpdate | SeatStatusUpdate[] | string | { seatId: string; isSelected: boolean; clientId: string } | null
}

class WebSocketService {
  private static instance: WebSocketService
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private maxReconnectDelay = 30000
  private listeners: ((message: WebSocketMessage) => void)[] = []
  private isConnecting = false
  private heartbeatInterval: NodeJS.Timeout | null = null
  private heartbeatTimeoutInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private lastHeartbeat = 0
  private heartbeatTimeout = 30000 // 30 seconds
  private url: string
  private clientId: string
  private connectionCount = 0
  private isDisconnecting = false

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  constructor() {
    // Use environment variable or default to a WebSocket server
    this.url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080"
    // Generate unique client ID
    this.clientId = `client_${Math.random().toString(36).substr(2, 9)}`
  }

  connect(url?: string) {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || this.isDisconnecting) {
      console.log(`[WebSocket] Connection attempt blocked - already connecting or disconnecting`)
      return
    }

    this.connectionCount++
    console.log(`[WebSocket] Connect called. Count: ${this.connectionCount}`)

    // If already connected, just return
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log(`[WebSocket] Already connected (${this.connectionCount} connections)`)
      return
    }

    if (url) {
      this.url = url
    }

    this.isConnecting = true
    this.isDisconnecting = false
    console.log(`[WebSocket] Connecting to ${this.url}... (${this.connectionCount} connections)`)

    try {
      this.ws = new WebSocket(this.url)
      this.setupEventHandlers()
    } catch (error) {
      console.error("[WebSocket] Failed to create WebSocket connection:", error)
      this.isConnecting = false
      this.handleConnectionError()
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log("[WebSocket] Connected successfully")
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.notifyListeners({
        type: "heartbeat",
        data: "connected"
      })
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage
        this.handleMessage(message)
      } catch (error) {
        console.error("[WebSocket] Failed to parse message:", error)
        this.notifyListeners({
          type: "error",
          data: "Failed to parse message"
        })
      }
    }

    this.ws.onclose = (event) => {
      console.log(`[WebSocket] Connection closed. Code: ${event.code}`)
      this.cleanup()

      // Only reconnect if it wasn't a manual disconnect and we haven't exceeded max attempts
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error("[WebSocket] Connection error:", error)
      this.handleConnectionError()
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case "heartbeat":
        this.lastHeartbeat = Date.now()
        break
      case "seat_update":
      case "bulk_update":
        this.notifyListeners(message)
        break
      case "error":
        console.error("[WebSocket] Server error:", message.data)
        this.notifyListeners(message)
        break
      default:
        console.warn("[WebSocket] Unknown message type:", message.type)
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    )

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  private handleConnectionError() {
    this.isConnecting = false
    this.notifyListeners({
      type: "error",
      data: "Connection failed"
    })

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  private cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.ws = null
    this.isConnecting = false
    this.isDisconnecting = false
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
    this.connectionCount = Math.max(0, this.connectionCount - 1)
    console.log(`[WebSocket] Disconnect requested (${this.connectionCount} connections remaining)`)

    // Only actually disconnect if no more components are using the connection
    if (this.connectionCount <= 0) {
      this.isDisconnecting = true
      this.cleanup()
      this.listeners = []
      console.log("[WebSocket] Fully disconnected")
    }
  }

  getConnectionState(): "connecting" | "connected" | "disconnected" {
    if (this.isConnecting) return "connecting"
    if (this.ws?.readyState === WebSocket.OPEN) return "connected"
    return "disconnected"
  }

  // Method to send messages to the server
  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn("[WebSocket] Cannot send message, connection not open")
    }
  }

  // Method to send seat selection updates
  sendSeatSelection(seatId: string, isSelected: boolean) {
    this.send({
      type: "seat_selection",
      data: {
        seatId,
        isSelected,
        clientId: this.clientId
      }
    })
  }

  // Method to get connection URL
  getUrl(): string {
    return this.url
  }

  // Method to update connection URL
  setUrl(url: string) {
    this.url = url
  }
}

export const websocketService = WebSocketService.getInstance()
