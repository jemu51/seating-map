import { getPriceForTier, getAllSeats } from "@/lib/venue-data"
import type { Venue } from "@/types/venue"

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
          ],
        },
      ],
    }

    it("should return all seats with additional metadata", () => {
      const seats = getAllSeats(mockVenue)

      expect(seats).toHaveLength(2)
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
  })
})
