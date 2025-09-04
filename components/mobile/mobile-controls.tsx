"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Menu, X, Zap, Search, Info, MapPin } from "lucide-react"

interface MobileControlsProps {
  selectedCount: number
  maxSeats: number
  onOpenSelection: () => void
  onOpenFinder: () => void
  onOpenInfo: () => void
  onOpenVenueSelector: () => void
}

export function MobileControls({
  selectedCount,
  maxSeats,
  onOpenSelection,
  onOpenFinder,
  onOpenInfo,
  onOpenVenueSelector,
}: MobileControlsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="h-14 w-14 rounded-full shadow-lg" aria-label="Open mobile menu">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Seating Options</SheetTitle>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <Button
                variant="outline"
                className="h-16 justify-start gap-4 bg-transparent"
                onClick={() => {
                  onOpenVenueSelector()
                  setIsOpen(false)
                }}
              >
                <MapPin className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Select Venue</div>
                  <div className="text-sm text-muted-foreground">Choose venue size</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 justify-start gap-4 bg-transparent"
                onClick={() => {
                  onOpenSelection()
                  setIsOpen(false)
                }}
              >
                <Zap className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">My Selection</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCount}/{maxSeats} seats selected
                  </div>
                </div>
                {selectedCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {selectedCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                className="h-16 justify-start gap-4 bg-transparent"
                onClick={() => {
                  onOpenFinder()
                  setIsOpen(false)
                }}
              >
                <Search className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Find Adjacent Seats</div>
                  <div className="text-sm text-muted-foreground">Search for seats together</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 justify-start gap-4 bg-transparent"
                onClick={() => {
                  onOpenInfo()
                  setIsOpen(false)
                }}
              >
                <Info className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Event Information</div>
                  <div className="text-sm text-muted-foreground">Venue details and availability</div>
                </div>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Selection indicator */}
      {selectedCount > 0 && (
        <div className="fixed bottom-20 right-4 z-30">
          <Badge variant="default" className="px-3 py-1">
            {selectedCount} selected
          </Badge>
        </div>
      )}
    </div>
  )
}
