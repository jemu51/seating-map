"use client"

import { useState } from "react"
import type { Venue } from "@/types/venue"
import { findAdjacentSeats, type AdjacentSeatGroup } from "@/lib/seat-finder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, MapPin, DollarSign } from "lucide-react"

interface AdjacentSeatFinderProps {
  venue: Venue
  onSelectGroup: (group: AdjacentSeatGroup) => void
  maxSeats: number
}

export function AdjacentSeatFinder({ venue, onSelectGroup, maxSeats }: AdjacentSeatFinderProps) {
  const [seatCount, setSeatCount] = useState(2)
  const [searchResults, setSearchResults] = useState<AdjacentSeatGroup[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = () => {
    if (seatCount < 1 || seatCount > maxSeats) {
      return
    }

    setIsSearching(true)
    // Simulate search delay for better UX
    setTimeout(() => {
      const results = findAdjacentSeats(venue, seatCount)
      setSearchResults(results.slice(0, 10)) // Limit to top 10 results
      setIsSearching(false)
    }, 300)
  }

  const handleSelectGroup = (group: AdjacentSeatGroup) => {
    onSelectGroup(group)
    setSearchResults([]) // Clear results after selection
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Find Adjacent Seats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="seat-count">Number of seats</Label>
            <Input
              id="seat-count"
              type="number"
              min={1}
              max={maxSeats}
              value={seatCount}
              onChange={(e) => setSeatCount(Number.parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} disabled={isSearching || seatCount < 1 || seatCount > maxSeats}>
              {isSearching ? "Searching..." : "Find"}
            </Button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Available Groups:</div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {searchResults.map((group, index) => (
                <div
                  key={`${group.sectionId}-${group.rowIndex}-${group.startCol}`}
                  className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3" />
                        <span className="font-medium">
                          Section {group.sectionId}, Row {group.rowIndex}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Seats {group.startCol}-{group.endCol}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium">${group.totalPrice}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleSelectGroup(group)}>
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchResults.length === 0 && !isSearching && seatCount > 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No adjacent seat groups found for {seatCount} seats.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
