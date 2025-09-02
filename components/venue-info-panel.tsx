"use client"

import type { Venue } from "@/types/venue"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, Info } from "lucide-react"

interface VenueInfoPanelProps {
  venue: Venue
  totalSeats: number
  availableSeats: number
}

export function VenueInfoPanel({ venue, totalSeats, availableSeats }: VenueInfoPanelProps) {
  const availabilityPercentage = Math.round((availableSeats / totalSeats) * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Event Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-medium">{venue.name}</div>
              <div className="text-sm text-muted-foreground">Venue ID: {venue.venueId}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-medium">Concert Night</div>
              <div className="text-sm text-muted-foreground">Saturday, March 15, 2025</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div className="font-medium">8:00 PM</div>
              <div className="text-sm text-muted-foreground">Doors open at 7:00 PM</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total seats:</span>
            <span>{totalSeats}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Available:</span>
            <span className="flex items-center gap-2">
              {availableSeats}
              <Badge
                variant={
                  availabilityPercentage > 50 ? "default" : availabilityPercentage > 20 ? "secondary" : "destructive"
                }
                className="text-xs"
              >
                {availabilityPercentage}%
              </Badge>
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Sections:</span>
            <span>{venue.sections.length}</span>
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 Use the heat map toggle to view seats by price tier, or use the adjacent seat finder to locate seats
            together.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
