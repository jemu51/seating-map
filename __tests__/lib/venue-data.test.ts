import { getPriceForTier, getAllSeats } from "@/lib/venue-data"
import type { Venue } from "@/types/venue"
import { describe, it, expect } from "@jest/globals"

describe("venue-data", () => {
  describe("getPriceForTier", () => {
    it("should return correct prices for different tiers", () => {
      expect(getPriceForTier(1)).toBe(150)
      expect(getPriceForTier(2)).toBe(120)
      expect(getPriceForTier(3)).toBe(100)
      expect(getPriceForTier(4)).toBe(80)
      expect(getPriceForTier(5)).toBe(60)
    })

    it("should return default price for unknown tier", () => {
      expect(getPriceForTier(99)).toBe(50)
    })

    it("should return default price for negative tier", () => {
      expect(getPriceForTier(-1)).toBe(50)
    })

    it("should return default price for zero tier", () => {
      expect(getPriceForTier(0)).toBe(50)
    })

    it("should handle all valid tiers", () => {
      const validTiers = [1, 2, 3, 4, 5]
      const expectedPrices = [150, 120, 100, 80, 60]

      validTiers.forEach((tier, index) => {
        expect(getPriceForTier(tier)).toBe(expectedPrices[index])
      })
    })
  })

  describe("getAllSeats", () => {
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
                {
                  id: "A-1-01",
                  col: 1,
                  x: 50,
                  y: 40,
                  priceTier: 1,
                  status: "available",
                },
                {
                  id: "A-1-02",
                  col: 2,
                  x: 80,
                  y: 40,
                  priceTier: 1,
                  status: "sold",
                },
              ],
            },
            {
              index: 2,
              seats: [
                {
                  id: "A-2-01",
                  col: 1,
                  x: 50,
                  y: 70,
                  priceTier: 2,
                  status: "available",
                },
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
                {
                  id: "B-1-01",
                  col: 1,
                  x: 250,
                  y: 40,
                  priceTier: 3,
                  status: "reserved",
                },
              ],
            },
          ],
        },
      ],
    }

    it("should return all seats with additional metadata", () => {
      const seats = getAllSeats(mockVenue)

      expect(seats).toHaveLength(4)
      expect(seats[0]).toEqual({
        id: "A-1-01",
        col: 1,
        x: 50,
        y: 40,
        priceTier: 1,
        status: "available",
        sectionId: "A",
        rowIndex: 1,
        price: 150,
      })
    })

    it("should include correct price for each seat", () => {
      const seats = getAllSeats(mockVenue)

      const seatA1 = seats.find(s => s.id === "A-1-01")
      const seatA2 = seats.find(s => s.id === "A-2-01")
      const seatB1 = seats.find(s => s.id === "B-1-01")

      expect(seatA1?.price).toBe(150) // Tier 1
      expect(seatA2?.price).toBe(120) // Tier 2
      expect(seatB1?.price).toBe(100) // Tier 3
    })

    it("should handle empty venue", () => {
      const emptyVenue: Venue = {
        venueId: "empty-venue",
        name: "Empty Venue",
        map: { width: 1024, height: 768 },
        sections: [],
      }

      const seats = getAllSeats(emptyVenue)
      expect(seats).toHaveLength(0)
    })

    it("should handle venue with empty sections", () => {
      const venueWithEmptySections: Venue = {
        venueId: "empty-sections",
        name: "Venue with Empty Sections",
        map: { width: 1024, height: 768 },
        sections: [
          {
            id: "A",
            label: "Section A",
            transform: { x: 0, y: 0, scale: 1 },
            rows: [],
          },
        ],
      }

      const seats = getAllSeats(venueWithEmptySections)
      expect(seats).toHaveLength(0)
    })

    it("should handle venue with empty rows", () => {
      const venueWithEmptyRows: Venue = {
        venueId: "empty-rows",
        name: "Venue with Empty Rows",
        map: { width: 1024, height: 768 },
        sections: [
          {
            id: "A",
            label: "Section A",
            transform: { x: 0, y: 0, scale: 1 },
            rows: [
              {
                index: 1,
                seats: [],
              },
            ],
          },
        ],
      }

      const seats = getAllSeats(venueWithEmptyRows)
      expect(seats).toHaveLength(0)
    })

    it("should preserve all original seat properties", () => {
      const seats = getAllSeats(mockVenue)

      seats.forEach(seat => {
        expect(seat).toHaveProperty("id")
        expect(seat).toHaveProperty("col")
        expect(seat).toHaveProperty("x")
        expect(seat).toHaveProperty("y")
        expect(seat).toHaveProperty("priceTier")
        expect(seat).toHaveProperty("status")
        expect(seat).toHaveProperty("sectionId")
        expect(seat).toHaveProperty("rowIndex")
        expect(seat).toHaveProperty("price")
      })
    })

    it("should handle seats with different statuses", () => {
      const seats = getAllSeats(mockVenue)

      const availableSeat = seats.find(s => s.status === "available")
      const soldSeat = seats.find(s => s.status === "sold")
      const reservedSeat = seats.find(s => s.status === "reserved")

      expect(availableSeat).toBeDefined()
      expect(soldSeat).toBeDefined()
      expect(reservedSeat).toBeDefined()
    })

    it("should correctly map section and row information", () => {
      const seats = getAllSeats(mockVenue)

      const sectionASeats = seats.filter(s => s.sectionId === "A")
      const sectionBSeats = seats.filter(s => s.sectionId === "B")

      expect(sectionASeats).toHaveLength(3)
      expect(sectionBSeats).toHaveLength(1)

      const row1Seats = seats.filter(s => s.rowIndex === 1)
      const row2Seats = seats.filter(s => s.rowIndex === 2)

      expect(row1Seats).toHaveLength(3)
      expect(row2Seats).toHaveLength(1)
    })

    it("should handle venue with multiple sections and rows", () => {
      const complexVenue: Venue = {
        venueId: "complex-venue",
        name: "Complex Venue",
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
                  { id: "A-2-01", col: 1, x: 50, y: 70, priceTier: 2, status: "available" },
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
                ],
              },
              {
                index: 2,
                seats: [
                  { id: "B-2-01", col: 1, x: 250, y: 70, priceTier: 4, status: "available" },
                  { id: "B-2-02", col: 2, x: 280, y: 70, priceTier: 4, status: "available" },
                ],
              },
            ],
          },
        ],
      }

      const seats = getAllSeats(complexVenue)
      expect(seats).toHaveLength(6)

      // Check all sections are represented
      const sectionIds = [...new Set(seats.map(s => s.sectionId))]
      expect(sectionIds).toEqual(["A", "B"])

      // Check all rows are represented
      const rowIndices = [...new Set(seats.map(s => s.rowIndex))]
      expect(rowIndices).toEqual([1, 2])
    })

    it("should handle seats with all price tiers", () => {
      const venueWithAllTiers: Venue = {
        venueId: "all-tiers",
        name: "All Tiers Venue",
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
                  { id: "A-1-02", col: 2, x: 80, y: 40, priceTier: 2, status: "available" },
                  { id: "A-1-03", col: 3, x: 110, y: 40, priceTier: 3, status: "available" },
                  { id: "A-1-04", col: 4, x: 140, y: 40, priceTier: 4, status: "available" },
                  { id: "A-1-05", col: 5, x: 170, y: 40, priceTier: 5, status: "available" },
                  { id: "A-1-06", col: 6, x: 200, y: 40, priceTier: 99, status: "available" }, // Unknown tier
                ],
              },
            ],
          },
        ],
      }

      const seats = getAllSeats(venueWithAllTiers)
      expect(seats).toHaveLength(6)

      const prices = seats.map(s => s.price)
      expect(prices).toEqual([150, 120, 100, 80, 60, 50]) // Last one is default price
    })

    it("should handle seats with all status types", () => {
      const venueWithAllStatuses: Venue = {
        venueId: "all-statuses",
        name: "All Statuses Venue",
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
                  { id: "A-1-02", col: 2, x: 80, y: 40, priceTier: 1, status: "sold" },
                  { id: "A-1-03", col: 3, x: 110, y: 40, priceTier: 1, status: "reserved" },
                ],
              },
            ],
          },
        ],
      }

      const seats = getAllSeats(venueWithAllStatuses)
      expect(seats).toHaveLength(3)

      const statuses = seats.map(s => s.status)
      expect(statuses).toEqual(["available", "sold", "reserved"])
    })

    it("should maintain original seat order within rows", () => {
      const seats = getAllSeats(mockVenue)

      // Seats should be in the order they appear in the venue data
      const sectionASeats = seats.filter(s => s.sectionId === "A")
      expect(sectionASeats[0].id).toBe("A-1-01")
      expect(sectionASeats[1].id).toBe("A-1-02")
      expect(sectionASeats[2].id).toBe("A-2-01")
    })

    it("should handle venue with no map data", () => {
      const venueWithoutMap: Venue = {
        venueId: "no-map",
        name: "No Map Venue",
        map: { width: 0, height: 0 },
        sections: [
          {
            id: "A",
            label: "Section A",
            transform: { x: 0, y: 0, scale: 1 },
            rows: [
              {
                index: 1,
                seats: [
                  { id: "A-1-01", col: 1, x: 0, y: 0, priceTier: 1, status: "available" },
                ],
              },
            ],
          },
        ],
      }

      const seats = getAllSeats(venueWithoutMap)
      expect(seats).toHaveLength(1)
      expect(seats[0].id).toBe("A-1-01")
    })
  })
})
