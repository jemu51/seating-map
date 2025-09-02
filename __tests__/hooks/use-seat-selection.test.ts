import { renderHook, act } from "@testing-library/react"
import { useSeatSelection } from "@/hooks/use-seat-selection"
import type { SelectedSeat } from "@/types/venue"
import { jest } from "@jest/globals"

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
})

describe("useSeatSelection", () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockClear()
  })

  const mockSeat: SelectedSeat = {
    id: "A-1-01",
    col: 1,
    x: 50,
    y: 40,
    priceTier: 1,
    status: "available",
    sectionId: "A",
    rowIndex: 1,
    price: 150,
  }

  it("should initialize with empty selection", () => {
    const { result } = renderHook(() => useSeatSelection())

    expect(result.current.selection.seats).toHaveLength(0)
    expect(result.current.selection.subtotal).toBe(0)
  })

  it("should add seat to selection", () => {
    const { result } = renderHook(() => useSeatSelection())

    act(() => {
      result.current.toggleSeat(mockSeat)
    })

    expect(result.current.selection.seats).toHaveLength(1)
    expect(result.current.selection.seats[0].id).toBe("A-1-01")
    expect(result.current.selection.subtotal).toBe(150)
  })

  it("should remove seat from selection when toggled again", () => {
    const { result } = renderHook(() => useSeatSelection())

    act(() => {
      result.current.toggleSeat(mockSeat)
    })

    act(() => {
      result.current.toggleSeat(mockSeat)
    })

    expect(result.current.selection.seats).toHaveLength(0)
    expect(result.current.selection.subtotal).toBe(0)
  })

  it("should not exceed maximum seat limit", () => {
    const { result } = renderHook(() => useSeatSelection())

    // Add 8 seats (the maximum)
    for (let i = 1; i <= 8; i++) {
      act(() => {
        result.current.toggleSeat({
          ...mockSeat,
          id: `A-1-${i.toString().padStart(2, "0")}`,
        })
      })
    }

    expect(result.current.selection.seats).toHaveLength(8)
    expect(result.current.canSelectMore).toBe(false)

    // Try to add one more
    act(() => {
      result.current.toggleSeat({
        ...mockSeat,
        id: "A-1-09",
      })
    })

    expect(result.current.selection.seats).toHaveLength(8) // Should still be 8
  })

  it("should clear all selections", () => {
    const { result } = renderHook(() => useSeatSelection())

    act(() => {
      result.current.toggleSeat(mockSeat)
    })

    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.selection.seats).toHaveLength(0)
    expect(result.current.selection.subtotal).toBe(0)
  })
})
