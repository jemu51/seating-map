import { findAdjacentSeats, getNextSeat } from "@/lib/seat-finder"
import type { Venue } from "@/types/venue"

describe("seat-finder", () => {
  const mockVenue: Venue = {
    venueId: "test-venue",
    name: "Test Venue",
    map: { width: 1024, height: 768 },
    sections: [
      {
        id: "A",
        label: "Section A",
        transform: { x: 0, y: 0, scale: 1 },
        rows: [
          {
            index: 1,
            seats: [
              { id: "A-1-01", col: 1, x: 50, y: 40, priceTier: 1, status: "available" },
              { id: "A-1-02", col: 2, x: 80, y: 40, priceTier: 1, status: "available" },
              { id: "A-1-03", col: 3, x: 110, y: 40, priceTier: 1, status: "sold" },
              { id: "A-1-04", col: 4, x: 140, y: 40, priceTier: 1, status: "available" },
            ],
          },
          {
            index: 2,
            seats: [
              { id: "A-2-01", col: 1, x: 50, y: 70, priceTier: 2, status: "available" },
              { id: "A-2-02", col: 2, x: 80, y: 70, priceTier: 2, status: "available" },
            ],
          },
        ],
      },
    ],
  }

  describe("findAdjacentSeats", () => {
    it("should find adjacent available seats", () => {
      const groups = findAdjacentSeats(mockVenue, 2)

      expect(groups).toHaveLength(2)
      expect(groups[0].seats).toHaveLength(2)
      expect(groups[0].seats[0].id).toBe("A-2-01")
      expect(groups[0].seats[1].id).toBe("A-2-02")
    })

    it("should not include sold seats in groups", () => {
      const groups = findAdjacentSeats(mockVenue, 3)

      // Should not find a group of 3 because A-1-03 is sold
      expect(groups).toHaveLength(0)
    })

    it("should sort groups by price", () => {
      const groups = findAdjacentSeats(mockVenue, 2)

      // First group should be cheaper (tier 2 = $120 each = $240 total)
      // Second group should be more expensive (tier 1 = $150 each = $300 total)
      expect(groups[0].totalPrice).toBeLessThan(groups[1].totalPrice)
    })
  })

  describe("getNextSeat", () => {
    it("should find seat to the right", () => {
      const nextSeat = getNextSeat(mockVenue, "A-1-01", "right")
      expect(nextSeat).toBe("A-1-02")
    })

    it("should find seat below", () => {
      const nextSeat = getNextSeat(mockVenue, "A-1-01", "down")
      expect(nextSeat).toBe("A-2-01")
    })

    it("should return null if no seat found", () => {
      const nextSeat = getNextSeat(mockVenue, "A-1-01", "left")
      expect(nextSeat).toBeNull()
    })
  })
})
