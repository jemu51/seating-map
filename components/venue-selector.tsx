"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { MapPin } from "lucide-react"
import { websocketService } from "@/lib/websocket-service"

export interface VenueOption {
  id: string
  name: string
  file: string
  description: string
  seatCount: number
}

const venueOptions: VenueOption[] = [
  {
    id: "small",
    name: "Small Venue",
    file: "venue.json",
    description: "Intimate venue with limited seating",
    seatCount: 10,
  },
  {
    id: "medium",
    name: "Medium Venue",
    file: "venue_medium.json",
    description: "Mid-size venue with moderate seating",
    seatCount: 1000,
  },
  {
    id: "large",
    name: "Large Venue",
    file: "venue_large.json",
    description: "Large arena with extensive seating",
    seatCount: 10000,
  },
]

interface VenueSelectorProps {
  selectedVenue: string
  onVenueChange: (venueId: string) => void
  disabled?: boolean
}

export function VenueSelector({ selectedVenue, onVenueChange, disabled = false }: VenueSelectorProps) {
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

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <Label htmlFor="venue-select" className="text-sm font-medium">
          Venue
        </Label>
        <Select value={selectedVenue} onValueChange={handleVenueChange} disabled={disabled || isSwitching}>
          <SelectTrigger id="venue-select" className="w-[200px]">
            <SelectValue placeholder="Select venue" />
          </SelectTrigger>
          <SelectContent>
            {venueOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{option.name}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isSwitching && <span className="text-xs text-muted-foreground">Switching venue...</span>}
      </div>
    </div>
  )
}

export { venueOptions }
