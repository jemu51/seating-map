"use client"

import { useMemo } from "react"
import type { Venue, Seat } from "@/types/venue"

export interface ViewportBounds {
  x: number
  y: number
  width: number
  height: number
}

export function useVisibleSeats(venue: Venue | null, viewBox: string, _scale: number) {
  return useMemo(() => {
    if (!venue) return { visibleSeats: [], totalSeats: 0 }

    // Parse viewBox to get current viewport
    const [x, y, width, height] = viewBox.split(" ").map(Number)
    const viewport: ViewportBounds = { x, y, width, height }

    // Add buffer around viewport for smooth scrolling
    const buffer = Math.max(width, height) * 0.2
    const bufferedViewport = {
      x: viewport.x - buffer,
      y: viewport.y - buffer,
      width: viewport.width + buffer * 2,
      height: viewport.height + buffer * 2,
    }

    const visibleSeats: Array<{
      seat: Seat
      sectionId: string
      rowIndex: number
      absoluteX: number
      absoluteY: number
    }> = []

    let totalSeats = 0

    for (const section of venue.sections) {
      for (const row of section.rows) {
        for (const seat of row.seats) {
          totalSeats++

          // Calculate absolute position considering section transform
          const absoluteX = seat.x + section.transform.x
          const absoluteY = seat.y + section.transform.y

          // Check if seat is within buffered viewport
          if (
            absoluteX >= bufferedViewport.x &&
            absoluteX <= bufferedViewport.x + bufferedViewport.width &&
            absoluteY >= bufferedViewport.y &&
            absoluteY <= bufferedViewport.y + bufferedViewport.height
          ) {
            visibleSeats.push({
              seat,
              sectionId: section.id,
              rowIndex: row.index,
              absoluteX,
              absoluteY,
            })
          }
        }
      }
    }

    return { visibleSeats, totalSeats }
  }, [venue, viewBox])
}

export function useSeatClustering(
  seats: Array<{ seat: Seat; sectionId: string; rowIndex: number; absoluteX: number; absoluteY: number }>,
  scale: number,
) {
  return useMemo(() => {
    // When zoomed out significantly, cluster nearby seats for performance
    if (scale > 0.3) {
      return { clusters: [], individualSeats: seats }
    }

    const clusterDistance = 50 / scale // Adjust cluster distance based on zoom
    const clusters: Array<{
      x: number
      y: number
      count: number
      seats: typeof seats
    }> = []
    const processed = new Set<number>()

    seats.forEach((seatData, index) => {
      if (processed.has(index)) return

      const cluster = {
        x: seatData.absoluteX,
        y: seatData.absoluteY,
        count: 1,
        seats: [seatData],
      }

      // Find nearby seats to cluster
      seats.forEach((otherSeatData, otherIndex) => {
        if (otherIndex === index || processed.has(otherIndex)) return

        const distance = Math.sqrt(
          Math.pow(seatData.absoluteX - otherSeatData.absoluteX, 2) +
          Math.pow(seatData.absoluteY - otherSeatData.absoluteY, 2),
        )

        if (distance <= clusterDistance) {
          cluster.seats.push(otherSeatData)
          cluster.count++
          processed.add(otherIndex)
        }
      })

      processed.add(index)
      clusters.push(cluster)
    })

    return {
      clusters: clusters.filter((c) => c.count > 3), // Only cluster if 4+ seats
      individualSeats: clusters.filter((c) => c.count <= 3).flatMap((c) => c.seats),
    }
  }, [seats, scale])
}
