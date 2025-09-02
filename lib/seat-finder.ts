import type { Venue, Seat, SelectedSeat } from "@/types/venue"
import { getPriceForTier } from "./venue-data"

export interface AdjacentSeatGroup {
  seats: SelectedSeat[]
  sectionId: string
  rowIndex: number
  startCol: number
  endCol: number
  totalPrice: number
}

export function findAdjacentSeats(venue: Venue, count: number): AdjacentSeatGroup[] {
  const groups: AdjacentSeatGroup[] = []

  for (const section of venue.sections) {
    for (const row of section.rows) {
      // Sort seats by column to ensure proper adjacency
      const availableSeats = row.seats.filter((seat) => seat.status === "available").sort((a, b) => a.col - b.col)

      // Find consecutive available seats
      for (let i = 0; i <= availableSeats.length - count; i++) {
        const consecutiveSeats = []
        let currentCol = availableSeats[i].col

        for (let j = i; j < availableSeats.length && consecutiveSeats.length < count; j++) {
          if (availableSeats[j].col === currentCol) {
            consecutiveSeats.push(availableSeats[j])
            currentCol++
          } else {
            break
          }
        }

        if (consecutiveSeats.length === count) {
          const selectedSeats: SelectedSeat[] = consecutiveSeats.map((seat) => ({
            ...seat,
            sectionId: section.id,
            rowIndex: row.index,
            price: getPriceForTier(seat.priceTier),
          }))

          groups.push({
            seats: selectedSeats,
            sectionId: section.id,
            rowIndex: row.index,
            startCol: consecutiveSeats[0].col,
            endCol: consecutiveSeats[consecutiveSeats.length - 1].col,
            totalPrice: selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0),
          })
        }
      }
    }
  }

  // Sort by total price (cheapest first) and then by section/row
  return groups.sort((a, b) => {
    if (a.totalPrice !== b.totalPrice) {
      return a.totalPrice - b.totalPrice
    }
    if (a.sectionId !== b.sectionId) {
      return a.sectionId.localeCompare(b.sectionId)
    }
    return a.rowIndex - b.rowIndex
  })
}

export function getNextSeat(
  venue: Venue,
  currentSeatId: string,
  direction: "up" | "down" | "left" | "right",
): string | null {
  let currentSeat: Seat | null = null
  let currentSection: string | null = null
  let currentRow: number | null = null

  // Find current seat
  for (const section of venue.sections) {
    for (const row of section.rows) {
      for (const seat of row.seats) {
        if (seat.id === currentSeatId) {
          currentSeat = seat
          currentSection = section.id
          currentRow = row.index
          break
        }
      }
      if (currentSeat) break
    }
    if (currentSeat) break
  }

  if (!currentSeat || !currentSection || currentRow === null) {
    return null
  }

  // Find target seat based on direction
  for (const section of venue.sections) {
    if (section.id !== currentSection) continue

    for (const row of section.rows) {
      if (direction === "up" && row.index === currentRow - 1) {
        // Find seat in same column in row above
        const targetSeat = row.seats.find((seat) => seat.col === currentSeat!.col)
        if (targetSeat && (targetSeat.status === "available" || targetSeat.status === "reserved")) {
          return targetSeat.id
        }
      } else if (direction === "down" && row.index === currentRow + 1) {
        // Find seat in same column in row below
        const targetSeat = row.seats.find((seat) => seat.col === currentSeat!.col)
        if (targetSeat && (targetSeat.status === "available" || targetSeat.status === "reserved")) {
          return targetSeat.id
        }
      } else if (row.index === currentRow) {
        if (direction === "left") {
          // Find seat to the left
          const targetSeat = row.seats.find((seat) => seat.col === currentSeat!.col - 1)
          if (targetSeat && (targetSeat.status === "available" || targetSeat.status === "reserved")) {
            return targetSeat.id
          }
        } else if (direction === "right") {
          // Find seat to the right
          const targetSeat = row.seats.find((seat) => seat.col === currentSeat!.col + 1)
          if (targetSeat && (targetSeat.status === "available" || targetSeat.status === "reserved")) {
            return targetSeat.id
          }
        }
      }
    }
  }

  return null
}
