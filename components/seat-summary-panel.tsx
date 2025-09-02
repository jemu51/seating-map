"use client"

import type { SeatSelection, SelectedSeat } from "@/types/venue"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, ShoppingCart, MapPin, DollarSign, Users } from "lucide-react"

interface SeatSummaryPanelProps {
  selection: SeatSelection
  maxSeats: number
  onClearSelection: () => void
  onRemoveSeat: (seatId: string) => void
}

export function SeatSummaryPanel({ selection, maxSeats, onClearSelection, onRemoveSeat }: SeatSummaryPanelProps) {
  const groupedSeats = selection.seats.reduce(
    (groups, seat) => {
      const key = `${seat.sectionId}-${seat.rowIndex}`
      if (!groups[key]) {
        groups[key] = {
          sectionId: seat.sectionId,
          rowIndex: seat.rowIndex,
          seats: [],
        }
      }
      groups[key].seats.push(seat)
      return groups
    },
    {} as Record<string, { sectionId: string; rowIndex: number; seats: SelectedSeat[] }>,
  )

  if (selection.seats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Selection Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm mb-2">No seats selected</p>
            <p className="text-xs text-muted-foreground">Click on available seats to add them to your selection</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Selection Summary
          </CardTitle>
          <Badge variant="secondary">
            {selection.seats.length}/{maxSeats}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grouped seats by section and row */}
        <div className="space-y-3">
          {Object.values(groupedSeats).map((group) => (
            <div key={`${group.sectionId}-${group.rowIndex}`} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-3 w-3" />
                <span>
                  Section {group.sectionId}, Row {group.rowIndex}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {group.seats.map((seat) => (
                  <div key={seat.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                    <div>
                      <div className="font-medium">Seat {seat.col}</div>
                      <div className="text-muted-foreground">${seat.price}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSeat(seat.id)}
                      className="h-6 w-6 p-0 hover:bg-destructive/20"
                      aria-label={`Remove seat ${seat.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Summary totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Seats:</span>
            <span>{selection.seats.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Average price:</span>
            <span>${Math.round(selection.subtotal / selection.seats.length)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Total:
            </span>
            <span>${selection.subtotal}</span>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Button className="w-full" size="lg">
            Proceed to Checkout
          </Button>
          <Button variant="outline" className="w-full bg-transparent" onClick={onClearSelection}>
            Clear All Seats
          </Button>
        </div>

        {/* Selection limit warning */}
        {selection.seats.length >= maxSeats && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Maximum seat limit reached ({maxSeats} seats)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
