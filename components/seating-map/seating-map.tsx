"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import type { Venue, Seat, SelectedSeat, SeatStatus } from "@/types/venue"
import { SectionComponent } from "./section"
import { getPriceForTier } from "@/lib/venue-data"
import { getNextSeat } from "@/lib/seat-finder"

interface SeatingMapProps {
  venue: Venue
  selectedSeatIds: Set<string>
  recentlySelectedSeatIds: Set<string>
  isHeatMapMode: boolean
  prefersReducedMotion: boolean
  highContrast: boolean
  getSeatStatus: (seatId: string, originalStatus: SeatStatus) => SeatStatus
  isSeatAnimating: (seatId: string) => boolean
  onSeatClick: (seat: SelectedSeat) => void
  onSeatFocus: (seat: SelectedSeat) => void
}

export function SeatingMap({
  venue,
  selectedSeatIds,
  recentlySelectedSeatIds,
  isHeatMapMode,
  prefersReducedMotion,
  highContrast,
  getSeatStatus,
  isSeatAnimating,
  onSeatClick,
  onSeatFocus,
}: SeatingMapProps) {
  const [viewBox, setViewBox] = useState(`0 0 ${venue.map.width} ${venue.map.height}`)
  const [scale, setScale] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [focusedSeatId, setFocusedSeatId] = useState<string | null>(null)
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const handleSeatClick = useCallback(
    (seat: Seat, sectionId: string, rowIndex: number) => {
      const currentStatus = getSeatStatus(seat.id, seat.status)
      const selectedSeat: SelectedSeat = {
        ...seat,
        status: currentStatus,
        sectionId,
        rowIndex,
        price: getPriceForTier(seat.priceTier),
      }
      onSeatClick(selectedSeat)
    },
    [onSeatClick, getSeatStatus],
  )

  const handleSeatFocus = useCallback(
    (seat: Seat, sectionId: string, rowIndex: number) => {
      const currentStatus = getSeatStatus(seat.id, seat.status)
      const selectedSeat: SelectedSeat = {
        ...seat,
        status: currentStatus,
        sectionId,
        rowIndex,
        price: getPriceForTier(seat.priceTier),
      }
      setFocusedSeatId(seat.id)
      onSeatFocus(selectedSeat)
    },
    [onSeatFocus, getSeatStatus],
  )

  const handleSeatKeyDown = useCallback(
    (seat: Seat, sectionId: string, rowIndex: number, key: string) => {
      const direction = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      }[key] as "up" | "down" | "left" | "right"

      if (direction) {
        const nextSeatId = getNextSeat(venue, seat.id, direction)
        if (nextSeatId) {
          // Focus the next seat
          const nextSeatElement = svgRef.current?.querySelector(`[data-seat-id="${nextSeatId}"]`) as SVGElement
          if (nextSeatElement) {
            nextSeatElement.focus()
          }
        }
      }
    },
    [venue],
  )

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2))
  }

  // Zoom functionality
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale((prev) => Math.max(0.5, Math.min(5, prev * delta)))
  }, [])

  // Add wheel event listener manually to avoid passive listener issues
  useEffect(() => {
    const svgElement = svgRef.current
    if (svgElement) {
      svgElement.addEventListener("wheel", handleWheel, { passive: false })
      return () => {
        svgElement.removeEventListener("wheel", handleWheel)
      }
    }
  }, [handleWheel])

  // Pan functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const deltaX = e.clientX - lastPanPoint.x
        const deltaY = e.clientY - lastPanPoint.y
        setPanOffset((prev) => ({
          x: prev.x + deltaX / scale,
          y: prev.y + deltaY / scale,
        }))
        setLastPanPoint({ x: e.clientX, y: e.clientY })
      }
    },
    [isPanning, lastPanPoint, scale],
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true)
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    } else if (e.touches.length === 2) {
      setIsPanning(false)
      const distance = getTouchDistance(e.touches)
      setLastTouchDistance(distance)
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      if (e.touches.length === 1 && isPanning) {
        // Single finger pan
        const deltaX = e.touches[0].clientX - lastPanPoint.x
        const deltaY = e.touches[0].clientY - lastPanPoint.y
        setPanOffset((prev) => ({
          x: prev.x + deltaX / scale,
          y: prev.y + deltaY / scale,
        }))
        setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      } else if (e.touches.length === 2 && lastTouchDistance) {
        // Two finger pinch-to-zoom
        const currentDistance = getTouchDistance(e.touches)
        if (currentDistance) {
          const scaleChange = currentDistance / lastTouchDistance
          setScale((prev) => Math.max(0.5, Math.min(5, prev * scaleChange)))
          setLastTouchDistance(currentDistance)
        }
      }
    },
    [isPanning, lastPanPoint, scale, lastTouchDistance],
  )

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false)
    setLastTouchDistance(null)
  }, [])

  // Update viewBox based on scale and pan
  useEffect(() => {
    const centerX = venue.map.width / 2
    const centerY = venue.map.height / 2
    const width = venue.map.width / scale
    const height = venue.map.height / scale
    const x = centerX - width / 2 - panOffset.x
    const y = centerY - height / 2 - panOffset.y

    setViewBox(`${x} ${y} ${width} ${height}`)
  }, [scale, panOffset, venue.map.width, venue.map.height])

  // Reset view function
  const resetView = () => {
    setScale(1)
    setPanOffset({ x: 0, y: 0 })
  }

  return (
    <div className="relative w-full h-full min-h-[500px] bg-muted/20 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setScale((prev) => Math.min(5, prev * 1.2))}
          className="px-3 py-1 bg-background border rounded text-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setScale((prev) => Math.max(0.5, prev * 0.8))}
          className="px-3 py-1 bg-background border rounded text-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          onClick={resetView}
          className="px-3 py-1 bg-background border rounded text-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Reset zoom and position"
        >
          Reset
        </button>
      </div>

      {/* SVG Map */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        viewBox={viewBox}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none" }}
        role="img"
        aria-label={`Seating map for ${venue.name} showing ${venue.sections.length} sections`}
        tabIndex={0}
      >
        <title>{`${venue.name} Seating Map`}</title>
        <desc>
          Interactive seating map with {venue.sections.length} sections. Use mouse or touch to pan and zoom. Tab to
          navigate between seats, use arrow keys to move between adjacent seats, and press Enter or Space to select
          seats.
        </desc>

        {/* Background */}
        <rect width={venue.map.width} height={venue.map.height} fill="transparent" pointerEvents="all" />

        {/* Render all sections */}
        {venue.sections.map((section) => (
          <SectionComponent
            key={section.id}
            section={section}
            selectedSeatIds={selectedSeatIds}
            recentlySelectedSeatIds={recentlySelectedSeatIds}
            focusedSeatId={focusedSeatId}
            isHeatMapMode={isHeatMapMode}
            prefersReducedMotion={prefersReducedMotion}
            highContrast={highContrast}
            getSeatStatus={getSeatStatus}
            isSeatAnimating={isSeatAnimating}
            onSeatClick={handleSeatClick}
            onSeatFocus={handleSeatFocus}
            onSeatKeyDown={handleSeatKeyDown}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3">
        <div className="text-sm font-medium mb-2" id="legend-title">
          {isHeatMapMode ? "Price Tiers" : "Seat Status"}
        </div>
        <div className="flex flex-wrap gap-3 text-xs" role="list" aria-labelledby="legend-title">
          {isHeatMapMode ? (
            <>
              <div className="flex items-center gap-1" role="listitem">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: highContrast ? "#FF0000" : "#ef4444" }}
                  aria-hidden="true"
                ></div>
                <span>Tier 1 ($150)</span>
              </div>
              <div className="flex items-center gap-1" role="listitem">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: highContrast ? "#FF8000" : "#f97316" }}
                  aria-hidden="true"
                ></div>
                <span>Tier 2 ($120)</span>
              </div>
              <div className="flex items-center gap-1" role="listitem">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: highContrast ? "#FFFF00" : "#eab308" }}
                  aria-hidden="true"
                ></div>
                <span>Tier 3 ($100)</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1" role="listitem">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: highContrast ? "#00FF00" : "#22c55e" }}
                  aria-hidden="true"
                ></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1" role="listitem">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: highContrast ? "#FFFF00" : "#eab308" }}
                  aria-hidden="true"
                ></div>
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-1" role="listitem">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: highContrast ? "#FF0000" : "#ef4444" }}
                  aria-hidden="true"
                ></div>
                <span>Sold</span>
              </div>
              <div className="flex items-center gap-1" role="listitem">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: highContrast ? "#FF8000" : "#f97316" }}
                  aria-hidden="true"
                ></div>
                <span>Held</span>
              </div>
              <div className="flex items-center gap-1" role="listitem">
                <div
                  className="w-3 h-3 rounded-sm border-2"
                  style={{
                    backgroundColor: highContrast ? "#0000FF" : "#3b82f6",
                    borderColor: highContrast ? "#FFFFFF" : "#1d4ed8",
                  }}
                  aria-hidden="true"
                ></div>
                <span>Selected</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
