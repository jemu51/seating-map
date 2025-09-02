import type { Venue } from "@/types/venue"

export async function loadVenueData(): Promise<Venue> {
  try {
    const response = await fetch("/venue.json")
    if (!response.ok) {
      throw new Error("Failed to load venue data")
    }
    return await response.json()
  } catch (error) {
    console.error("Error loading venue data:", error)
    throw error
  }
}

export function getPriceForTier(tier: number): number {
  // Price mapping for different tiers
  const priceMap: Record<number, number> = {
    1: 150,
    2: 120,
    3: 100,
    4: 80,
    5: 60,
  }
  return priceMap[tier] || 50
}

export function getAllSeats(venue: Venue) {
  const allSeats = []
  for (const section of venue.sections) {
    for (const row of section.rows) {
      for (const seat of row.seats) {
        allSeats.push({
          ...seat,
          sectionId: section.id,
          rowIndex: row.index,
          price: getPriceForTier(seat.priceTier),
        })
      }
    }
  }
  return allSeats
}
