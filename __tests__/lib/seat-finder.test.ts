import { findAdjacentSeats, getNextSeat } from "@/lib/seat-finder"
import type { Venue } from "@/types/venue"
import { describe, it, expect } from "@jest/globals"

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
              { id: "A-1-05", col: 5, x: 170, y: 40, priceTier: 1, status: "available" },
            ],
          },
          {
            index: 2,
            seats: [
              { id: "A-2-01", col: 1, x: 50, y: 70, priceTier: 2, status: "available" },
              { id: "A-2-02", col: 2, x: 80, y: 70, priceTier: 2, status: "available" },
              { id: "A-2-03", col: 3, x: 110, y: 70, priceTier: 2, status: "available" },
            ],
          },
        ],
      },
      {
        id: "B",
        label: "Section B",
        transform: { x: 200, y: 0, scale: 1 },
        rows: [
          {
            index: 1,
            seats: [
              { id: "B-1-01", col: 1, x: 250, y: 40, priceTier: 3, status: "available" },
              { id: "B-1-02", col: 2, x: 280, y: 40, priceTier: 3, status: "available" },
            ],
          },
        ],
      },
    ],
  }

  describe("findAdjacentSeats", () => {
    it("should find adjacent available seats", () => {
      const groups = findAdjacentSeats(mockVenue, 2)

      expect(groups.length).toBeGreaterThan(0)
      groups.forEach(group => {
        expect(group.seats).toHaveLength(2)
      })
      // First group should be cheapest (tier 3 = $100 each)
      expect(groups[0].seats[0].id).toBe("B-1-01")
      expect(groups[0].seats[1].id).toBe("B-1-02")
    })

    it("should not include sold seats in groups", () => {
      const groups = findAdjacentSeats(mockVenue, 3)

      // Should find groups that don't include the sold seat A-1-03
      expect(groups.length).toBeGreaterThan(0)
      groups.forEach(group => {
        expect(group.seats.some(seat => seat.id === "A-1-03")).toBe(false)
      })
    })

    it("should sort groups by price", () => {
      const groups = findAdjacentSeats(mockVenue, 2)

      // Groups should be sorted by total price (cheapest first)
      for (let i = 1; i < groups.length; i++) {
        expect(groups[i - 1].totalPrice).toBeLessThanOrEqual(groups[i].totalPrice)
      }
    })

    it("should return empty array when no adjacent seats found", () => {
      const emptyVenue: Venue = {
        venueId: "empty-venue",
        name: "Empty Venue",
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
                  { id: "A-1-01", col: 1, x: 50, y: 40, priceTier: 1, status: "sold" },
                  { id: "A-1-02", col: 2, x: 80, y: 40, priceTier: 1, status: "sold" },
                ],
              },
            ],
          },
        ],
      }

      const groups = findAdjacentSeats(emptyVenue, 2)
      expect(groups).toHaveLength(0)
    })

    it("should handle single seat requests", () => {
      const groups = findAdjacentSeats(mockVenue, 1)

      expect(groups.length).toBeGreaterThan(0)
      groups.forEach(group => {
        expect(group.seats).toHaveLength(1)
      })
    })

    it("should include correct metadata in groups", () => {
      const groups = findAdjacentSeats(mockVenue, 2)

      expect(groups.length).toBeGreaterThan(0)
      groups.forEach(group => {
        expect(group).toHaveProperty("sectionId")
        expect(group).toHaveProperty("rowIndex")
        expect(group).toHaveProperty("startCol")
        expect(group).toHaveProperty("endCol")
        expect(group).toHaveProperty("totalPrice")
        expect(group.seats).toHaveLength(2)

        // Check that seats have correct metadata
        group.seats.forEach(seat => {
          expect(seat).toHaveProperty("sectionId")
          expect(seat).toHaveProperty("rowIndex")
          expect(seat).toHaveProperty("price")
        })
      })
    })

    it("should handle non-consecutive seat columns", () => {
      const venueWithGaps: Venue = {
        venueId: "gaps-venue",
        name: "Venue with Gaps",
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
                  { id: "A-1-03", col: 3, x: 110, y: 40, priceTier: 1, status: "available" },
                  { id: "A-1-05", col: 5, x: 170, y: 40, priceTier: 1, status: "available" },
                ],
              },
            ],
          },
        ],
      }

      const groups = findAdjacentSeats(venueWithGaps, 2)
      expect(groups).toHaveLength(0) // No consecutive seats
    })

    it("should find consecutive seats across multiple rows", () => {
      const venueWithConsecutiveRows: Venue = {
        venueId: "consecutive-rows",
        name: "Venue with Consecutive Rows",
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
                ],
              },
              {
                index: 2,
                seats: [
                  { id: "A-2-01", col: 1, x: 50, y: 70, priceTier: 1, status: "available" },
                  { id: "A-2-02", col: 2, x: 80, y: 70, priceTier: 1, status: "available" },
                ],
              },
            ],
          },
        ],
      }

      const groups = findAdjacentSeats(venueWithConsecutiveRows, 2)
      expect(groups).toHaveLength(2) // One group per row
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

    it("should find seat above", () => {
      const nextSeat = getNextSeat(mockVenue, "A-2-01", "up")
      expect(nextSeat).toBe("A-1-01")
    })

    it("should find seat to the left", () => {
      const nextSeat = getNextSeat(mockVenue, "A-1-02", "left")
      expect(nextSeat).toBe("A-1-01")
    })

    it("should return null if no seat found", () => {
      const nextSeat = getNextSeat(mockVenue, "A-1-01", "left")
      expect(nextSeat).toBeNull()
    })

    it("should return null for non-existent seat", () => {
      const nextSeat = getNextSeat(mockVenue, "NONEXISTENT", "right")
      expect(nextSeat).toBeNull()
    })

    it("should return null when target seat is sold", () => {
      const nextSeat = getNextSeat(mockVenue, "A-1-02", "right")
      expect(nextSeat).toBeNull() // A-1-03 is sold
    })

    it("should find available seat even if some are reserved", () => {
      const venueWithReserved: Venue = {
        venueId: "reserved-venue",
        name: "Venue with Reserved Seats",
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
                  { id: "A-1-02", col: 2, x: 80, y: 40, priceTier: 1, status: "reserved" },
                  { id: "A-1-03", col: 3, x: 110, y: 40, priceTier: 1, status: "available" },
                ],
              },
            ],
          },
        ],
      }

      const nextSeat = getNextSeat(venueWithReserved, "A-1-01", "right")
      expect(nextSeat).toBe("A-1-02") // Should find reserved seat
    })

    it("should handle edge seats correctly", () => {
      const nextSeat = getNextSeat(mockVenue, "A-1-05", "right")
      expect(nextSeat).toBeNull() // No seat to the right
    })

    it("should work across different sections", () => {
      const nextSeat = getNextSeat(mockVenue, "A-1-01", "right")
      expect(nextSeat).toBe("A-1-02") // Should stay within same section
    })

    it("should handle venue with single seat", () => {
      const singleSeatVenue: Venue = {
        venueId: "single-seat",
        name: "Single Seat Venue",
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
                ],
              },
            ],
          },
        ],
      }

      expect(getNextSeat(singleSeatVenue, "A-1-01", "right")).toBeNull()
      expect(getNextSeat(singleSeatVenue, "A-1-01", "left")).toBeNull()
      expect(getNextSeat(singleSeatVenue, "A-1-01", "up")).toBeNull()
      expect(getNextSeat(singleSeatVenue, "A-1-01", "down")).toBeNull()
    })

    it("should handle venue with non-consecutive seat numbers", () => {
      const nonConsecutiveVenue: Venue = {
        venueId: "non-consecutive",
        name: "Non-Consecutive Venue",
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
                  { id: "A-1-05", col: 5, x: 170, y: 40, priceTier: 1, status: "available" },
                  { id: "A-1-10", col: 10, x: 320, y: 40, priceTier: 1, status: "available" },
                ],
              },
            ],
          },
        ],
      }

      // The getNextSeat function looks for consecutive column numbers
      // Since A-1-01 has col: 1 and A-1-05 has col: 5, they are not consecutive
      expect(getNextSeat(nonConsecutiveVenue, "A-1-01", "right")).toBeNull()
      expect(getNextSeat(nonConsecutiveVenue, "A-1-05", "right")).toBeNull()
      expect(getNextSeat(nonConsecutiveVenue, "A-1-10", "right")).toBeNull()
      expect(getNextSeat(nonConsecutiveVenue, "A-1-05", "left")).toBeNull()
      expect(getNextSeat(nonConsecutiveVenue, "A-1-01", "left")).toBeNull()
    })

    it("should handle venue with mixed seat statuses in navigation", () => {
      const mixedStatusVenue: Venue = {
        venueId: "mixed-status",
        name: "Mixed Status Venue",
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
                  { id: "A-1-02", col: 2, x: 80, y: 40, priceTier: 1, status: "reserved" },
                  { id: "A-1-03", col: 3, x: 110, y: 40, priceTier: 1, status: "available" },
                  { id: "A-1-04", col: 4, x: 140, y: 40, priceTier: 1, status: "available" },
                ],
              },
            ],
          },
        ],
      }

      // The getNextSeat function looks for consecutive column numbers
      // A-1-01 (col: 1) -> A-1-02 (col: 2) should work
      expect(getNextSeat(mixedStatusVenue, "A-1-01", "right")).toBe("A-1-02") // Reserved seat
      // A-1-02 (col: 2) -> A-1-03 (col: 3) should work
      expect(getNextSeat(mixedStatusVenue, "A-1-02", "right")).toBe("A-1-03") // Available seat
      // A-1-03 (col: 3) -> A-1-04 (col: 4) should work
      expect(getNextSeat(mixedStatusVenue, "A-1-03", "right")).toBe("A-1-04") // Available seat
      expect(getNextSeat(mixedStatusVenue, "A-1-04", "right")).toBeNull()
    })

    it("should handle edge case with negative column numbers", () => {
      const negativeColVenue: Venue = {
        venueId: "negative-col",
        name: "Negative Column Venue",
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
                  { id: "A-1-01", col: -1, x: 50, y: 40, priceTier: 1, status: "available" },
                  { id: "A-1-02", col: 0, x: 80, y: 40, priceTier: 1, status: "available" },
                  { id: "A-1-03", col: 1, x: 110, y: 40, priceTier: 1, status: "available" },
                ],
              },
            ],
          },
        ],
      }

      expect(getNextSeat(negativeColVenue, "A-1-01", "right")).toBe("A-1-02")
      expect(getNextSeat(negativeColVenue, "A-1-02", "right")).toBe("A-1-03")
      expect(getNextSeat(negativeColVenue, "A-1-03", "right")).toBeNull()
    })
  })
})
