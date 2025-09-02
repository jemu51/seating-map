"use client"

import React from "react"
import type { Section, Seat, SeatStatus } from "@/types/venue"
import { SeatComponent } from "./seat"

interface SectionProps {
  section: Section
  selectedSeatIds: Set<string>
  recentlySelectedSeatIds: Set<string>
  focusedSeatId: string | null
  isHeatMapMode: boolean
  prefersReducedMotion: boolean
  highContrast: boolean
  getSeatStatus: (seatId: string, originalStatus: SeatStatus) => SeatStatus
  isSeatAnimating: (seatId: string) => boolean
  onSeatClick: (seat: Seat, sectionId: string, rowIndex: number) => void
  onSeatFocus: (seat: Seat, sectionId: string, rowIndex: number) => void
  onSeatKeyDown: (seat: Seat, sectionId: string, rowIndex: number, key: string) => void
}

export const SectionComponent = React.memo(function SectionComponent({
  section,
  selectedSeatIds,
  recentlySelectedSeatIds,
  focusedSeatId,
  isHeatMapMode,
  prefersReducedMotion,
  highContrast,
  getSeatStatus,
  isSeatAnimating,
  onSeatClick,
  onSeatFocus,
  onSeatKeyDown,
}: SectionProps) {
  return (
    <g transform={`translate(${section.transform.x}, ${section.transform.y}) scale(${section.transform.scale})`}>
      {/* Section label */}
      <text x={100} y={20} textAnchor="middle" className="fill-foreground text-sm font-medium" pointerEvents="none">
        {section.label}
      </text>

      {/* Render all seats in this section */}
      {section.rows.map((row) =>
        row.seats.map((seat) => (
          <SeatComponent
            key={seat.id}
            seat={seat}
            sectionId={section.id}
            rowIndex={row.index}
            isSelected={selectedSeatIds.has(seat.id)}
            isRecentlySelected={recentlySelectedSeatIds.has(seat.id)}
            isAnimating={isSeatAnimating(seat.id)}
            isFocused={focusedSeatId === seat.id}
            isHeatMapMode={isHeatMapMode}
            prefersReducedMotion={prefersReducedMotion}
            highContrast={highContrast}
            currentStatus={getSeatStatus(seat.id, seat.status)}
            onSeatClick={onSeatClick}
            onSeatFocus={onSeatFocus}
            onSeatKeyDown={onSeatKeyDown}
          />
        )),
      )}
    </g>
  )
})
