"use client"

import { useState, useEffect } from "react"
import type { Venue, SelectedSeat } from "@/types/venue"
import { loadVenueData, getAllSeats } from "@/lib/venue-data"
import { useSeatSelection } from "@/hooks/use-seat-selection"
import { useWebSocketUpdates } from "@/hooks/use-websocket-updates"
import { useAccessibility } from "@/hooks/use-accessibility"
import { SeatingMap } from "@/components/seating-map/seating-map"
import { SeatSummaryPanel } from "@/components/seat-summary-panel"
import { VenueInfoPanel } from "@/components/venue-info-panel"
import { AdjacentSeatFinder } from "@/components/adjacent-seat-finder"
import { VenueSelector, venueOptions } from "@/components/venue-selector"
import { ThemeToggle } from "@/components/theme-toggle"
import { ConnectionStatus } from "@/components/connection-status"
import { SkipLinks } from "@/components/accessibility/skip-links"
import { LiveRegion } from "@/components/accessibility/live-region"
import { MobileControls } from "@/components/mobile/mobile-controls"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, MapPin } from "lucide-react"
import type { AdjacentSeatGroup } from "@/lib/seat-finder"

export default function SeatingMapPage() {
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isHeatMapMode, setIsHeatMapMode] = useState(false)
  const [focusedSeat, setFocusedSeat] = useState<SelectedSeat | null>(null)
  const [activeTab, setActiveTab] = useState("selection")
  const [mobileDialogOpen, setMobileDialogOpen] = useState(false)
  const [selectedVenueId, setSelectedVenueId] = useState("small")

  const {
    selection,
    toggleSeat,
    selectMultipleSeats,
    clearSelection,
    isSeatSelected,
    isSeatRecentlySelected,
    canSelectMore,
    maxSeats,
  } = useSeatSelection()

  const { getSeatStatus, isSeatAnimating, connectionStatus, updateCount } = useWebSocketUpdates(venue)

  const { announcements, prefersReducedMotion, highContrast, announce, announceSelection } = useAccessibility()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        announce("Loading venue data")

        const selectedOption = venueOptions.find((option) => option.id === selectedVenueId)
        const venueFile = selectedOption?.file || "venue.json"

        const venueData = await loadVenueData(venueFile)
        setVenue(venueData)
        announce(`Venue data loaded. ${venueData.name} with ${venueData.sections.length} sections.`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load venue data"
        setError(errorMessage)
        announce(`Error: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [announce, selectedVenueId])

  const handleSeatClick = (seat: SelectedSeat) => {
    const currentStatus = getSeatStatus(seat.id, seat.status)
    if (currentStatus === "available" || isSeatSelected(seat.id)) {
      const wasSelected = isSeatSelected(seat.id)
      toggleSeat({ ...seat, status: currentStatus })
      announceSelection(seat.id, wasSelected ? "deselected" : "selected")
    }
  }

  const handleSeatFocus = (seat: SelectedSeat) => {
    const currentStatus = getSeatStatus(seat.id, seat.status)
    setFocusedSeat({ ...seat, status: currentStatus })
  }

  const handleRemoveSeat = (seatId: string) => {
    const seat = selection.seats.find((s) => s.id === seatId)
    if (seat) {
      toggleSeat(seat)
      announceSelection(seatId, "deselected")
    }
  }

  const handleSelectAdjacentGroup = (group: AdjacentSeatGroup) => {
    selectMultipleSeats(group.seats)
    announce(`Selected ${group.seats.length} adjacent seats in section ${group.sectionId}`)
  }

  const handleClearSelection = () => {
    const count = selection.seats.length
    clearSelection()
    announce(`Cleared selection of ${count} seats`)
  }

  const handleVenueChange = (venueId: string) => {
    setSelectedVenueId(venueId)
    // Clear current selection when switching venues
    clearSelection()
    announce(`Switching to ${venueOptions.find((option) => option.id === venueId)?.name || "new venue"}`)
  }

  const selectedSeatIds = new Set(selection.seats.map((seat) => seat.id))
  const recentlySelectedSeatIds = new Set(
    selection.seats.filter((seat) => isSeatRecentlySelected(seat.id)).map((seat) => seat.id),
  )

  // Calculate venue statistics
  const allSeats = venue ? getAllSeats(venue) : []
  const availableSeats = allSeats.filter((seat) => {
    const currentStatus = getSeatStatus(seat.id, seat.status)
    return currentStatus === "available"
  }).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          <span>Loading venue data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md" role="alert">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!venue) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <SkipLinks />
      <LiveRegion message={announcements} />

      {/* SEO-friendly header with structured data */}
      <header
        className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50"
        itemScope
        itemType="https://schema.org/Event"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-balance" itemProp="name">
                {venue.name}
              </h1>
              <p className="text-muted-foreground">Interactive Seating Map</p>

              {/* Hidden structured data for SEO */}
              <div className="sr-only" itemProp="description">
                Book concert tickets with our interactive seating map platform. Real-time seat availability, adjacent
                seat finder, and seamless ticket selection experience for concerts and live events.
              </div>
              <div className="sr-only" itemProp="eventStatus">
                https://schema.org/EventScheduled
              </div>
              <div className="sr-only" itemProp="eventAttendanceMode">
                https://schema.org/OfflineEventAttendanceMode
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              {/* Venue Selector in Header */}
              <VenueSelector
                selectedVenue={selectedVenueId}
                onVenueChange={handleVenueChange}
                disabled={loading}
                compact={true}
              />
              <ConnectionStatus status={connectionStatus} updateCount={updateCount} />
              <div className="flex items-center space-x-2">
                <Switch
                  id="heat-map"
                  checked={isHeatMapMode}
                  onCheckedChange={(checked) => {
                    setIsHeatMapMode(checked)
                    announce(checked ? "Heat map mode enabled" : "Heat map mode disabled")
                  }}
                />
                <Label htmlFor="heat-map" className="text-sm">
                  Heat Map
                </Label>
              </div>
              <div className="text-sm text-muted-foreground" aria-live="polite">
                {selection.seats.length}/{maxSeats} selected
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main content with semantic HTML */}
      <main id="main-content" className="container mx-auto px-4 py-6">
        {/* SEO-friendly introduction section */}
        <section className="mb-8" aria-labelledby="platform-intro">
          <h2 id="platform-intro" className="sr-only">
            Concert Seat Booking Platform Features
          </h2>
          {/* Remove the venue selector section since it's now in the header */}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Main seating map */}
          <section className="xl:col-span-3" aria-labelledby="seating-map-title">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div id="seating-map" role="application" aria-label="Interactive seating map">
                  <SeatingMap
                    venue={venue}
                    selectedSeatIds={selectedSeatIds}
                    recentlySelectedSeatIds={recentlySelectedSeatIds}
                    isHeatMapMode={isHeatMapMode}
                    prefersReducedMotion={prefersReducedMotion}
                    highContrast={highContrast}
                    getSeatStatus={getSeatStatus}
                    isSeatAnimating={isSeatAnimating}
                    onSeatClick={handleSeatClick}
                    onSeatFocus={handleSeatFocus}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Desktop sidebar */}
          <aside className="hidden xl:block xl:col-span-2 space-y-6" aria-label="Seat selection and venue information">
            <div id="seat-selection">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="selection">Selection</TabsTrigger>
                  <TabsTrigger value="finder">Find Seats</TabsTrigger>
                  <TabsTrigger value="info">Event Info</TabsTrigger>
                </TabsList>

                <TabsContent value="selection" className="space-y-4">
                  {focusedSeat && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          Seat Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Seat:</span>
                            <div className="font-medium">{focusedSeat.id}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Section:</span>
                            <div className="font-medium">{focusedSeat.sectionId}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Row:</span>
                            <div className="font-medium">{focusedSeat.rowIndex}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="font-medium capitalize flex items-center gap-2">
                              {focusedSeat.status}
                              {isSeatAnimating(focusedSeat.id) && (
                                <span className="text-xs text-blue-500" aria-live="polite">
                                  updating...
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price:</span>
                            <div className="font-medium">${focusedSeat.price}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tier:</span>
                            <div className="font-medium">{focusedSeat.priceTier}</div>
                          </div>
                        </div>
                        {focusedSeat.status === "available" && (
                          <Button
                            className="w-full"
                            onClick={() => handleSeatClick(focusedSeat)}
                            disabled={!canSelectMore && !isSeatSelected(focusedSeat.id)}
                            aria-describedby="seat-action-description"
                          >
                            {isSeatSelected(focusedSeat.id) ? "Remove from Selection" : "Add to Selection"}
                          </Button>
                        )}
                        <div id="seat-action-description" className="sr-only">
                          {focusedSeat.status === "available"
                            ? isSeatSelected(focusedSeat.id)
                              ? "This will remove the seat from your selection"
                              : "This will add the seat to your selection"
                            : "This seat is not available for selection"}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <SeatSummaryPanel
                    selection={selection}
                    maxSeats={maxSeats}
                    onClearSelection={handleClearSelection}
                    onRemoveSeat={handleRemoveSeat}
                  />
                </TabsContent>

                <TabsContent value="finder">
                  <AdjacentSeatFinder venue={venue} onSelectGroup={handleSelectAdjacentGroup} maxSeats={maxSeats} />
                </TabsContent>

                <TabsContent value="info">
                  <VenueInfoPanel venue={venue} totalSeats={allSeats.length} availableSeats={availableSeats} />
                </TabsContent>
              </Tabs>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile controls */}
      <MobileControls
        selectedCount={selection.seats.length}
        maxSeats={maxSeats}
        onOpenSelection={() => {
          setActiveTab("selection")
          setMobileDialogOpen(true)
        }}
        onOpenFinder={() => {
          setActiveTab("finder")
          setMobileDialogOpen(true)
        }}
        onOpenInfo={() => {
          setActiveTab("info")
          setMobileDialogOpen(true)
        }}
        onOpenVenueSelector={() => {
          setActiveTab("venue")
          setMobileDialogOpen(true)
        }}
      />

      {/* Mobile dialog */}
      <Dialog open={mobileDialogOpen} onOpenChange={setMobileDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "selection" && "Seat Selection"}
              {activeTab === "finder" && "Find Adjacent Seats"}
              {activeTab === "info" && "Event Information"}
              {activeTab === "venue" && "Select Venue"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Venue selector for mobile */}
            <div className="md:hidden">
              <VenueSelector selectedVenue={selectedVenueId} onVenueChange={handleVenueChange} disabled={loading} />
            </div>

            {activeTab === "selection" && (
              <SeatSummaryPanel
                selection={selection}
                maxSeats={maxSeats}
                onClearSelection={handleClearSelection}
                onRemoveSeat={handleRemoveSeat}
              />
            )}
            {activeTab === "finder" && (
              <AdjacentSeatFinder venue={venue} onSelectGroup={handleSelectAdjacentGroup} maxSeats={maxSeats} />
            )}
            {activeTab === "info" && (
              <VenueInfoPanel venue={venue} totalSeats={allSeats.length} availableSeats={availableSeats} />
            )}
            {activeTab === "venue" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose a venue size to view different seating configurations.
                </p>
                <div className="space-y-2">
                  {venueOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedVenueId === option.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        handleVenueChange(option.id)
                        setMobileDialogOpen(false)
                      }}
                    >
                      <div className="font-medium">{option.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* SEO-friendly footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Concert Seat Booking Platform</h3>
              <p className="text-sm text-muted-foreground">
                The ultimate platform for booking concert tickets with interactive seating maps, real-time availability,
                and seamless ticket selection experience.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Interactive Seating Maps</li>
                <li>Real-time Seat Availability</li>
                <li>Adjacent Seat Finder</li>
                <li>Mobile Responsive Design</li>
                <li>Accessibility Features</li>
                <li>Live Updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  Contact Support:{" "}
                  <a href="mailto:almansursiddiqui@gmail.com" className="underline hover:text-primary">
                    almansursiddiqui@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Concert Seat Booking Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
