// @ts-nocheck
import { loadVenueData } from "@/lib/venue-data"
import type { Venue } from "@/types/venue"
import { describe, it, expect, jest, beforeEach } from "@jest/globals"

// Mock fetch with proper typing
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
global.fetch = mockFetch

describe("loadVenueData", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should load venue data successfully", async () => {
    const mockVenueData: Venue = {
      venueId: "test-venue",
      name: "Test Venue",
      map: { width: 1024, height: 768 },
      sections: [],
    }

    // @ts-ignore
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVenueData,
    })

    const result = await loadVenueData("venue.json")

    expect(fetch).toHaveBeenCalledWith("/venue.json")
    expect(result).toEqual(mockVenueData)
  })

  it("should use default filename when none provided", async () => {
    const mockVenueData: Venue = {
      venueId: "test-venue",
      name: "Test Venue",
      map: { width: 1024, height: 768 },
      sections: [],
    }

    // @ts-ignore
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVenueData,
    })

    await loadVenueData()

    expect(fetch).toHaveBeenCalledWith("/venue.json")
  })

  it("should handle network errors", async () => {
    const networkError = new Error("Network error")
    mockFetch.mockRejectedValueOnce(networkError)

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { })

    await expect(loadVenueData("venue.json")).rejects.toThrow("Network error")
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error loading venue data from venue.json:",
      networkError
    )

    consoleSpy.mockRestore()
  })

  it("should handle HTTP error responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    })

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { })

    await expect(loadVenueData("venue.json")).rejects.toThrow(
      "Failed to load venue data from venue.json"
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error loading venue data from venue.json:",
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })

  it("should handle JSON parsing errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error("Invalid JSON")
      },
    })

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { })

    await expect(loadVenueData("venue.json")).rejects.toThrow("Invalid JSON")
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error loading venue data from venue.json:",
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })

  it("should handle different venue file names", async () => {
    const mockVenueData: Venue = {
      venueId: "large-venue",
      name: "Large Venue",
      map: { width: 1024, height: 768 },
      sections: [],
    }

    // @ts-ignore
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVenueData,
    })

    const result = await loadVenueData("venue_large.json")

    expect(fetch).toHaveBeenCalledWith("/venue_large.json")
    expect(result).toEqual(mockVenueData)
  })

  it("should handle timeout errors", async () => {
    const timeoutError = new Error("Request timeout")
    timeoutError.name = "TimeoutError"
    mockFetch.mockRejectedValueOnce(timeoutError)

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { })

    await expect(loadVenueData("venue.json")).rejects.toThrow("Request timeout")
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error loading venue data from venue.json:",
      timeoutError
    )

    consoleSpy.mockRestore()
  })

  it("should handle 500 server error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    })

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { })

    await expect(loadVenueData("venue.json")).rejects.toThrow(
      "Failed to load venue data from venue.json"
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error loading venue data from venue.json:",
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })

  it("should handle 403 forbidden error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    })

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { })

    await expect(loadVenueData("venue.json")).rejects.toThrow(
      "Failed to load venue data from venue.json"
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error loading venue data from venue.json:",
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })

  it("should handle malformed JSON response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON at position 0")
      },
    })

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { })

    await expect(loadVenueData("venue.json")).rejects.toThrow("Unexpected token < in JSON at position 0")
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error loading venue data from venue.json:",
      expect.any(SyntaxError)
    )

    consoleSpy.mockRestore()
  })

  it("should handle empty response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    })

    const result = await loadVenueData("venue.json")
    expect(result).toBeNull()
  })

  it("should handle undefined response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => undefined,
    })

    const result = await loadVenueData("venue.json")
    expect(result).toBeUndefined()
  })

  it("should handle AbortError", async () => {
    const abortError = new Error("The operation was aborted")
    abortError.name = "AbortError"
    mockFetch.mockRejectedValueOnce(abortError)

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { })

    await expect(loadVenueData("venue.json")).rejects.toThrow("The operation was aborted")
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error loading venue data from venue.json:",
      abortError
    )

    consoleSpy.mockRestore()
  })

  it("should handle TypeError from fetch", async () => {
    const typeError = new TypeError("Failed to fetch")
    mockFetch.mockRejectedValueOnce(typeError)

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { })

    await expect(loadVenueData("venue.json")).rejects.toThrow("Failed to fetch")
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error loading venue data from venue.json:",
      typeError
    )

    consoleSpy.mockRestore()
  })
})
