"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Users, Building2, Theater } from "lucide-react"
import { websocketService } from "@/lib/websocket-service"
import { Card, CardContent } from "@/components/ui/card"

export interface VenueOption {
  id: string
  name: string
  file: string
}

const venueOptions: VenueOption[] = [
  {
    id: "small",
    name: "Small Venue",
    file: "venue.json",
  },
  {
    id: "medium",
    name: "Medium Venue",
    file: "venue_medium.json",
  },
  {
    id: "large",
    name: "Large Venue",
    file: "venue_large.json",
  },
]

interface VenueSelectorProps {
  selectedVenue: string
  onVenueChange: (venueId: string) => void
  disabled?: boolean
  compact?: boolean
}

export function VenueSelector({ selectedVenue, onVenueChange, disabled = false, compact = false }: VenueSelectorProps) {
  const [isSwitching, setIsSwitching] = useState(false)

  const handleVenueChange = (venueId: string) => {
    if (disabled || isSwitching) return

    const option = venueOptions.find((opt) => opt.id === venueId)
    if (!option) return

    setIsSwitching(true)

    // Send venue switch request via websocket
    websocketService.switchVenue(option.file)

    // Call the parent handler
    onVenueChange(venueId)

    // Reset switching state after a delay
    setTimeout(() => setIsSwitching(false), 1000)
  }

  const getVenueIcon = (venueId: string) => {
    switch (venueId) {
      case "small":
        return <Theater className="h-4 w-4" />
      case "medium":
        return <Building2 className="h-4 w-4" />
      case "large":
        return <Users className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  // Compact version for header
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Select value={selectedVenue} onValueChange={handleVenueChange} disabled={disabled || isSwitching}>
          <SelectTrigger
            id="venue-select-compact"
            className="w-40 h-9 bg-background border border-border hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {getVenueIcon(selectedVenue)}
              <SelectValue placeholder="Venue" />
            </div>
          </SelectTrigger>
          <SelectContent className="w-40">
            {venueOptions.map((option) => (
              <SelectItem key={option.id} value={option.id} className="py-2">
                <div className="flex items-center gap-2 w-full">
                  {getVenueIcon(option.id)}
                  <span className="text-sm">{option.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isSwitching && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
        )}
      </div>
    )
  }

  // Full version (existing code)
  return (
    <Card className="w-full max-w-lg mx-auto bg-gradient-to-br from-card to-card/80 border-2 border-primary/20 shadow-lg">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Select Your Venue</h3>
              <p className="text-sm text-muted-foreground">Choose the venue size for your event</p>
            </div>
          </div>

          {/* Venue Selector */}
          <div className="space-y-2">
            <Select value={selectedVenue} onValueChange={handleVenueChange} disabled={disabled || isSwitching}>
              <SelectTrigger
                id="venue-select"
                className="w-full h-12 bg-background border-2 border-border hover:border-primary/50 transition-colors"
              >
                <SelectValue placeholder="Select a venue" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {venueOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id} className="py-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-1 bg-muted rounded">{getVenueIcon(option.id)}</div>
                      <div className="flex-1">
                        <div className="font-medium">{option.name}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isSwitching && (
            <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Switching venue...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { venueOptions }
