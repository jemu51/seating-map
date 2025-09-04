"use client"

import React from "react"
import { cn } from "@/lib/utils"
import type { Seat, SeatStatus } from "@/types/venue"

interface SeatProps {
  seat: Seat
  sectionId: string
  rowIndex: number
  isSelected: boolean
  isRecentlySelected: boolean
  isAnimating: boolean
  isHeatMapMode: boolean
  isFocused: boolean
  prefersReducedMotion: boolean
  highContrast: boolean
  currentStatus?: SeatStatus
  onSeatClick: (seat: Seat, sectionId: string, rowIndex: number) => void
  onSeatFocus: (seat: Seat, sectionId: string, rowIndex: number) => void
  onSeatKeyDown: (seat: Seat, sectionId: string, rowIndex: number, key: string) => void
}

const SEAT_SIZE = 10 // Reduce from 12 to 10 for better spacing
const SEAT_RADIUS = 2

function getSeatColor(
  status: SeatStatus,
  isSelected: boolean,
  isHeatMapMode: boolean,
  priceTier: number,
  highContrast: boolean,
) {
  if (isSelected) {
    return highContrast ? "#0000FF" : "#3b82f6" // blue-500 or high contrast blue
  }

  if (isHeatMapMode) {
    // Heat map colors with high contrast variants
    const heatColors = highContrast
      ? {
          1: "#FF0000", // red (highest price)
          2: "#FF8000", // orange
          3: "#FFFF00", // yellow
          4: "#00FF00", // green
          5: "#00FFFF", // cyan (lowest price)
        }
      : {
          1: "#ef4444", // red-500 (highest price)
          2: "#f97316", // orange-500
          3: "#eab308", // yellow-500
          4: "#22c55e", // green-500
          5: "#06b6d4", // cyan-500 (lowest price)
        }
    return heatColors[priceTier as keyof typeof heatColors] || (highContrast ? "#808080" : "#6b7280")
  }

  // Status-based colors with high contrast variants
  if (highContrast) {
    switch (status) {
      case "available":
        return "#00FF00" // bright green
      case "reserved":
        return "#FFFF00" // bright yellow
      case "sold":
        return "#FF0000" // bright red
      case "held":
        return "#FF8000" // bright orange
      default:
        return "#808080" // gray
    }
  } else {
    switch (status) {
      case "available":
        return "#22c55e" // green-500
      case "reserved":
        return "#eab308" // yellow-500
      case "sold":
        return "#ef4444" // red-500
      case "held":
        return "#f97316" // orange-500
      default:
        return "#6b7280" // gray-500
    }
  }
}

export const SeatComponent = React.memo(function SeatComponent({
  seat,
  sectionId,
  rowIndex,
  isSelected,
  isRecentlySelected,
  isAnimating,
  isHeatMapMode,
  isFocused,
  prefersReducedMotion,
  highContrast,
  currentStatus,
  onSeatClick,
  onSeatFocus,
  onSeatKeyDown,
}: SeatProps) {
  const effectiveStatus = currentStatus || seat.status
  const isInteractive = effectiveStatus === "available" || isSelected
  const seatColor = getSeatColor(effectiveStatus, isSelected, isHeatMapMode, seat.priceTier, highContrast)

  const handleClick = () => {
    if (isInteractive) {
      onSeatClick(seat, sectionId, rowIndex)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClick()
    } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault()
      onSeatKeyDown(seat, sectionId, rowIndex, e.key)
    }
  }

  const handleFocus = () => {
    onSeatFocus(seat, sectionId, rowIndex)
  }

  return (
    <g>
      <rect
        x={seat.x - SEAT_SIZE / 2}
        y={seat.y - SEAT_SIZE / 2}
        width={SEAT_SIZE}
        height={SEAT_SIZE}
        rx={SEAT_RADIUS}
        fill={seatColor}
        stroke={
          isSelected
            ? highContrast
              ? "#FFFFFF"
              : "#1d4ed8"
            : isFocused
            ? highContrast
              ? "#FFFFFF"
              : "#6366f1"
            : "transparent"
        }
        strokeWidth={isSelected ? (highContrast ? 3 : 2) : isFocused ? (highContrast ? 2 : 1) : 0}
        className={cn(
          "transition-all duration-200",
          isInteractive &&
            "cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          !prefersReducedMotion && isAnimating && "animate-bounce",
          !prefersReducedMotion && isRecentlySelected && "animate-pulse",
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        tabIndex={isInteractive ? 0 : -1}
        role="button"
        aria-label={`Seat ${seat.id} in section ${sectionId} row ${rowIndex}, ${effectiveStatus}, price tier ${
          seat.priceTier
        }${isSelected ? ", currently selected" : ""}${isFocused ? ", focused" : ""}${
          isAnimating ? ", status updating" : ""
        }`}
        aria-pressed={isSelected}
        aria-describedby={`seat-${seat.id}-description`}
        data-seat-id={seat.id}
      />
      {isAnimating && !prefersReducedMotion && (
        <circle
          cx={seat.x}
          cy={seat.y}
          r={SEAT_SIZE}
          fill="none"
          stroke={highContrast ? "#FFFFFF" : "#3b82f6"}
          strokeWidth={highContrast ? "3" : "2"}
          className="animate-ping"
          opacity="0.75"
        />
      )}
      {/* Hidden description for screen readers */}
      <desc id={`seat-${seat.id}-description`}>
        {`Seat ${seat.col} in section ${sectionId}, row ${rowIndex}. Status: ${effectiveStatus}. Price tier ${seat.priceTier}.`}
        {isInteractive ? " Press Enter or Space to select." : " Not available for selection."}
        {isFocused ? " Use arrow keys to navigate to adjacent seats." : ""}
      </desc>
      {/* Seat number text for larger seats */}
      {SEAT_SIZE >= 16 && (
        <text
          x={seat.x}
          y={seat.y + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fill={highContrast ? "#000000" : "white"}
          pointerEvents="none"
          className="select-none"
          aria-hidden="true"
        >
          {seat.col}
        </text>
      )}
    </g>
  )
})
