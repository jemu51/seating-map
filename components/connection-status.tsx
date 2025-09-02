"use client"

import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Loader2 } from "lucide-react"

interface ConnectionStatusProps {
  status: "connecting" | "connected" | "disconnected"
  updateCount?: number
}

export function ConnectionStatus({ status, updateCount = 0 }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          icon: <Wifi className="h-3 w-3" />,
          text: "Live",
          variant: "default" as const,
          className: "bg-green-500 hover:bg-green-600",
        }
      case "connecting":
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: "Connecting",
          variant: "secondary" as const,
          className: "bg-yellow-500 hover:bg-yellow-600",
        }
      case "disconnected":
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: "Offline",
          variant: "destructive" as const,
          className: "",
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
      {config.icon}
      <span>{config.text}</span>
      {status === "connected" && updateCount > 0 && <span className="text-xs opacity-75">({updateCount})</span>}
    </Badge>
  )
}
