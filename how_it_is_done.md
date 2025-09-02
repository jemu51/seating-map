# How It Is Done: Interactive Event Seating Map

## Table of Contents
1. [Project Overview](#project-overview)
2. [Core Technologies & Libraries](#core-technologies--libraries)
3. [Application Architecture](#application-architecture)
4. [Data Structure & Flow](#data-structure--flow)
5. [Feature Implementation Guide](#feature-implementation-guide)
6. [JavaScript Concepts Explained](#javascript-concepts-explained)
7. [Performance Optimizations](#performance-optimizations)
8. [Accessibility Implementation](#accessibility-implementation)
9. [Testing Strategy](#testing-strategy)

---

## Project Overview

This is a **React + TypeScript** application that creates an interactive seating map for events. Think of it like choosing seats at a movie theater, but for large venues with thousands of seats. The application allows users to:

- **View** a visual map of all seats in a venue
- **Select** up to 8 seats by clicking or using keyboard
- **See real-time updates** when seat availability changes
- **Find adjacent seats** automatically
- **Use on mobile** with touch gestures
- **Access with screen readers** for visually impaired users

---

## Core Technologies & Libraries

### **React 19** - The UI Framework
```javascript
// React is a library for building user interfaces
import { useState, useEffect } from "react"

// useState creates a "state variable" that can change over time
const [venue, setVenue] = useState<Venue | null>(null)

// useEffect runs code when the component loads or when dependencies change
useEffect(() => {
  loadVenueData()
}, [])
```

**Why React?** React makes it easy to build interactive UIs by breaking them into reusable components.

### **TypeScript** - Type Safety
```typescript
// TypeScript adds types to JavaScript to catch errors early
interface Seat {
  id: string
  col: number
  x: number
  y: number
  priceTier: number
  status: SeatStatus
}

// This prevents bugs like: seat.priceTier = "expensive" // ❌ Error!
```

**Why TypeScript?** It helps catch bugs before they happen and makes code easier to understand.

### **Next.js 14** - React Framework
```javascript
// Next.js adds features like:
// - File-based routing (pages automatically become routes)
// - Server-side rendering
// - Built-in optimization
// - TypeScript support out of the box
```

### **SVG (Scalable Vector Graphics)** - The Map Rendering
```javascript
// SVG is used instead of Canvas because:
// 1. Better accessibility (screen readers can read SVG elements)
// 2. Crisp at any zoom level
// 3. Easy to add click events to individual seats
// 4. CSS styling works on SVG elements

<svg viewBox="0 0 1024 768">
  <rect x={50} y={40} width={12} height={12} fill="green" />
</svg>
```

### **Tailwind CSS** - Styling
```javascript
// Tailwind provides utility classes for styling
<div className="flex items-center justify-between p-4 bg-blue-500 text-white">
  // This creates a flex container with centered items, padding, blue background, white text
</div>
```

### **Radix UI** - Accessible Components
```javascript
// Radix provides accessible, unstyled components
import { Dialog, DialogContent } from "@/components/ui/dialog"

// These components handle keyboard navigation, focus management, and ARIA attributes automatically
```

---

## Application Architecture

### **Component Hierarchy**
```
App (page.tsx)
├── SeatingMap (main map component)
│   ├── SectionComponent (renders each section)
│   │   └── SeatComponent (individual seats)
├── SeatSummaryPanel (shows selected seats)
├── AdjacentSeatFinder (finds nearby seats)
├── VenueInfoPanel (venue details)
└── MobileControls (mobile-specific UI)
```

### **Custom Hooks** - Business Logic Separation
```javascript
// Hooks contain the "business logic" - the rules of how the app works
// They're separate from UI components for better organization

// useSeatSelection - manages which seats are selected
const { selection, toggleSeat, clearSelection } = useSeatSelection()

// useWebSocketUpdates - handles real-time seat updates
const { getSeatStatus, isSeatAnimating } = useWebSocketUpdates(venue)

// useAccessibility - manages screen reader announcements
const { announce, prefersReducedMotion } = useAccessibility()
```

**Why Custom Hooks?** They let us reuse logic across components and keep components focused on rendering.

---

## Data Structure & Flow

### **Venue Data Structure**
```javascript
// The venue.json file contains all seat information
{
  "venueId": "arena-01",
  "name": "Metropolis Arena",
  "map": { "width": 1024, "height": 768 },
  "sections": [
    {
      "id": "A",
      "label": "Lower Bowl A",
      "transform": { "x": 0, "y": 0, "scale": 1 },
      "rows": [
        {
          "index": 1,
          "seats": [
            {
              "id": "A-1-01",
              "col": 1,
              "x": 50,        // X coordinate on the map
              "y": 40,        // Y coordinate on the map
              "priceTier": 1, // 1 = most expensive, 5 = cheapest
              "status": "available" // available | reserved | sold | held
            }
          ]
        }
      ]
    }
  ]
}
```

### **State Management Flow**
```javascript
// 1. App loads venue data
const [venue, setVenue] = useState<Venue | null>(null)

// 2. User clicks a seat
const handleSeatClick = (seat) => {
  toggleSeat(seat) // This updates the selection state
}

// 3. Selection state changes
const { selection } = useSeatSelection() // Returns current selection

// 4. UI updates automatically (React re-renders)
<SeatSummaryPanel selection={selection} />
```

### **Data Flow Diagram**
```
User Action → Event Handler → State Update → Component Re-render → UI Update
     ↓              ↓              ↓              ↓              ↓
  Click Seat → handleSeatClick → toggleSeat → selection changes → Map updates
```

---

## Feature Implementation Guide

### **1. Interactive Seat Selection**

#### **How Seat Clicking Works**
```javascript
// In SeatComponent
const handleClick = () => {
  if (isInteractive) {
    onSeatClick(seat, sectionId, rowIndex)
  }
}

// In main App component
const handleSeatClick = (seat) => {
  const currentStatus = getSeatStatus(seat.id, seat.status)
  if (currentStatus === "available" || isSeatSelected(seat.id)) {
    toggleSeat({ ...seat, status: currentStatus })
  }
}
```

**Key Concepts:**
- **Event Handling**: `onClick` triggers a function when clicked
- **Conditional Logic**: Only available or selected seats can be clicked
- **State Updates**: `toggleSeat` adds/removes seats from selection
- **Spread Operator**: `{ ...seat, status: currentStatus }` copies seat data with updated status

#### **Selection State Management**
```javascript
// useSeatSelection hook
const toggleSeat = useCallback((seat) => {
  setSelection((prev) => {
    const isSelected = prev.seats.some((s) => s.id === seat.id)
    
    if (isSelected) {
      // Remove seat from selection
      const newSeats = prev.seats.filter((s) => s.id !== seat.id)
      return {
        seats: newSeats,
        subtotal: newSeats.reduce((sum, s) => sum + getPriceForTier(s.priceTier), 0)
      }
    } else {
      // Add seat if under limit (max 8 seats)
      if (prev.seats.length >= MAX_SEATS) return prev
      
      const newSeats = [...prev.seats, seat]
      return {
        seats: newSeats,
        subtotal: newSeats.reduce((sum, s) => sum + getPriceForTier(s.priceTier), 0)
      }
    }
  })
}, [])
```

**Key Concepts:**
- **useCallback**: Prevents function from being recreated on every render (performance optimization)
- **Array Methods**: 
  - `some()` - checks if any seat matches the condition
  - `filter()` - creates new array with only matching items
  - `reduce()` - calculates total price by summing all seat prices
- **Spread Operator**: `[...prev.seats, seat]` adds new seat to existing array
- **Functional Updates**: `setSelection((prev) => ...)` uses previous state to calculate new state

### **2. Real-time Updates with WebSocket**

#### **WebSocket Service**
```javascript
class WebSocketService {
  private listeners = []
  
  // Subscribe to updates
  subscribe(listener) {
    this.listeners.push(listener)
    return () => this.listeners = this.listeners.filter(l => l !== listener)
  }
  
  // Notify all listeners of updates
  private notifyListeners(message) {
    this.listeners.forEach(listener => listener(message))
  }
}
```

**Key Concepts:**
- **Class**: A blueprint for creating objects with methods and properties
- **Private Properties**: `private listeners` can only be accessed within the class
- **Observer Pattern**: Multiple components can "listen" for updates
- **Cleanup Function**: Returns a function to unsubscribe when component unmounts

#### **Real-time Updates Hook**
```javascript
export function useWebSocketUpdates(venue) {
  const [seatUpdates, setSeatUpdates] = useState(new Map())
  const [animatingSeats, setAnimatingSeats] = useState(new Set())
  
  const handleSeatUpdate = useCallback((update) => {
    // Add visual animation
    setAnimatingSeats(prev => new Set(prev).add(update.seatId))
    
    // Update seat status
    setSeatUpdates(prev => new Map(prev).set(update.seatId, update.status))
    
    // Remove animation after 1 second
    setTimeout(() => {
      setAnimatingSeats(prev => {
        const next = new Set(prev)
        next.delete(update.seatId)
        return next
      })
    }, 1000)
  }, [])
}
```

**Key Concepts:**
- **Map**: A data structure that stores key-value pairs (seatId → status)
- **Set**: A data structure that stores unique values (animating seat IDs)
- **setTimeout**: Executes code after a delay
- **State Updates**: Multiple state variables track different aspects of updates

### **3. Adjacent Seat Finding**

#### **Algorithm Implementation**
```javascript
export function findAdjacentSeats(venue, count) {
  const groups = []
  
  for (const section of venue.sections) {
    for (const row of section.rows) {
      // Get available seats sorted by column
      const availableSeats = row.seats
        .filter(seat => seat.status === "available")
        .sort((a, b) => a.col - b.col)
      
      // Find consecutive seats
      for (let i = 0; i <= availableSeats.length - count; i++) {
        const consecutiveSeats = []
        let currentCol = availableSeats[i].col
        
        for (let j = i; j < availableSeats.length && consecutiveSeats.length < count; j++) {
          if (availableSeats[j].col === currentCol) {
            consecutiveSeats.push(availableSeats[j])
            currentCol++
          } else {
            break // Not consecutive anymore
          }
        }
        
        if (consecutiveSeats.length === count) {
          groups.push({
            seats: consecutiveSeats,
            sectionId: section.id,
            rowIndex: row.index,
            totalPrice: consecutiveSeats.reduce((sum, seat) => sum + getPriceForTier(seat.priceTier), 0)
          })
        }
      }
    }
  }
  
  // Sort by price (cheapest first)
  return groups.sort((a, b) => a.totalPrice - b.totalPrice)
}
```

**Key Concepts:**
- **Nested Loops**: Check every section, row, and seat
- **Array Filtering**: `filter()` gets only available seats
- **Array Sorting**: `sort()` orders seats by column number
- **Consecutive Check**: Verify seats are next to each other (col + 1)
- **Algorithm**: This is a "sliding window" approach to find consecutive items

### **4. Zoom and Pan Functionality**

#### **SVG ViewBox Manipulation**
```javascript
const [viewBox, setViewBox] = useState("0 0 1024 768")
const [scale, setScale] = useState(1)

// Handle mouse wheel for zooming
const handleWheel = (e) => {
  e.preventDefault()
  
  const rect = svgRef.current.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(5, scale * zoomFactor))
  
  // Calculate new viewBox to zoom towards mouse position
  const [x, y, width, height] = viewBox.split(" ").map(Number)
  const newWidth = 1024 / newScale
  const newHeight = 768 / newScale
  
  const newX = x + (mouseX / rect.width) * (width - newWidth)
  const newY = y + (mouseY / rect.height) * (height - newHeight)
  
  setViewBox(`${newX} ${newY} ${newWidth} ${newHeight}`)
  setScale(newScale)
}
```

**Key Concepts:**
- **SVG ViewBox**: Defines what portion of the SVG is visible (x, y, width, height)
- **Mouse Coordinates**: `e.clientX - rect.left` gets mouse position relative to element
- **Zoom Calculation**: Adjust viewBox size to create zoom effect
- **Pan Calculation**: Adjust viewBox position to pan around
- **Math.max/Math.min**: Clamp values between minimum and maximum

### **5. Mobile Touch Gestures**

#### **Touch Event Handling**
```javascript
const [isDragging, setIsDragging] = useState(false)
const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 })

const handleTouchStart = (e) => {
  if (e.touches.length === 1) {
    // Single touch - start panning
    setIsDragging(true)
    setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  } else if (e.touches.length === 2) {
    // Two touches - start pinch zoom
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
    setLastTouch({ x: distance, y: 0 })
  }
}

const handleTouchMove = (e) => {
  e.preventDefault()
  
  if (e.touches.length === 1 && isDragging) {
    // Pan the map
    const touch = e.touches[0]
    const deltaX = touch.clientX - lastTouch.x
    const deltaY = touch.clientY - lastTouch.y
    
    // Update viewBox to pan
    const [x, y, width, height] = viewBox.split(" ").map(Number)
    setViewBox(`${x - deltaX} ${y - deltaY} ${width} ${height}`)
    setLastTouch({ x: touch.clientX, y: touch.clientY })
  }
}
```

**Key Concepts:**
- **Touch Events**: `touchstart`, `touchmove`, `touchend` for mobile interaction
- **Touch Count**: `e.touches.length` determines single touch (pan) vs two touches (pinch)
- **Distance Calculation**: Pythagorean theorem to calculate distance between two touches
- **Delta Calculation**: Difference between current and previous touch positions
- **preventDefault()**: Stops browser from handling touch events (like scrolling)

### **6. Heat Map Visualization**

#### **Color Coding by Price Tier**
```javascript
function getSeatColor(status, isSelected, isHeatMapMode, priceTier, highContrast) {
  if (isSelected) {
    return highContrast ? "#0000FF" : "#3b82f6" // Blue for selected
  }
  
  if (isHeatMapMode) {
    // Color by price tier
    const heatColors = {
      1: "#ef4444", // Red (most expensive)
      2: "#f97316", // Orange
      3: "#eab308", // Yellow
      4: "#22c55e", // Green
      5: "#06b6d4", // Cyan (cheapest)
    }
    return heatColors[priceTier] || "#6b7280"
  }
  
  // Default: color by status
  switch (status) {
    case "available": return "#22c55e" // Green
    case "reserved": return "#eab308"  // Yellow
    case "sold": return "#ef4444"      // Red
    case "held": return "#f97316"      // Orange
    default: return "#6b7280"          // Gray
  }
}
```

**Key Concepts:**
- **Conditional Rendering**: Different colors based on mode and state
- **Object Lookup**: `heatColors[priceTier]` gets color for specific tier
- **Switch Statement**: Clean way to handle multiple conditions
- **Color Theory**: Red = expensive, Green = cheap (intuitive color mapping)

---

## JavaScript Concepts Explained

### **1. React Hooks**

#### **useState - Managing Component State**
```javascript
// useState returns an array with two elements:
// [currentValue, functionToUpdateValue]
const [count, setCount] = useState(0)

// When you call setCount, React re-renders the component
setCount(count + 1) // or setCount(prev => prev + 1)
```

**Why useState?** Components need to "remember" things that can change (like selected seats).

#### **useEffect - Side Effects**
```javascript
// Runs after every render
useEffect(() => {
  console.log("Component rendered")
})

// Runs only once (on mount)
useEffect(() => {
  loadData()
}, []) // Empty dependency array

// Runs when 'venue' changes
useEffect(() => {
  if (venue) {
    connectWebSocket()
  }
}, [venue]) // 'venue' in dependency array
```

**Why useEffect?** Components need to do things like load data, connect to servers, or clean up resources.

#### **useCallback - Function Memoization**
```javascript
// Without useCallback - function recreated on every render
const handleClick = (seat) => {
  toggleSeat(seat)
}

// With useCallback - function only recreated when dependencies change
const handleClick = useCallback((seat) => {
  toggleSeat(seat)
}, [toggleSeat]) // Only recreate if toggleSeat changes
```

**Why useCallback?** Prevents unnecessary re-renders of child components that receive this function as a prop.

### **2. Array Methods**

#### **map() - Transform Arrays**
```javascript
// Convert seat objects to seat IDs
const seatIds = seats.map(seat => seat.id)
// Result: ["A-1-01", "A-1-02", "A-1-03"]

// Convert seats to JSX elements
const seatElements = seats.map(seat => 
  <SeatComponent key={seat.id} seat={seat} />
)
```

#### **filter() - Select Items**
```javascript
// Get only available seats
const availableSeats = seats.filter(seat => seat.status === "available")

// Get seats in specific section
const sectionASeats = seats.filter(seat => seat.sectionId === "A")
```

#### **reduce() - Calculate Totals**
```javascript
// Calculate total price
const totalPrice = seats.reduce((sum, seat) => sum + seat.price, 0)

// Count seats by status
const statusCounts = seats.reduce((counts, seat) => {
  counts[seat.status] = (counts[seat.status] || 0) + 1
  return counts
}, {})
// Result: { available: 5, sold: 3, reserved: 2 }
```

#### **find() - Find Single Item**
```javascript
// Find seat by ID
const seat = seats.find(seat => seat.id === "A-1-01")

// Find first available seat
const firstAvailable = seats.find(seat => seat.status === "available")
```

#### **some() - Check if Any Match**
```javascript
// Check if any seat is selected
const hasSelection = seats.some(seat => seat.isSelected)

// Check if seat is in selection
const isSelected = selection.seats.some(s => s.id === seat.id)
```

### **3. Object and Array Destructuring**

#### **Object Destructuring**
```javascript
// Instead of:
const venue = props.venue
const name = props.name
const sections = props.sections

// Use destructuring:
const { venue, name, sections } = props

// Or in function parameters:
function SeatingMap({ venue, selectedSeats, onSeatClick }) {
  // venue, selectedSeats, onSeatClick are available directly
}
```

#### **Array Destructuring**
```javascript
// useState returns an array, destructure it:
const [count, setCount] = useState(0)

// Destructure array elements:
const [first, second, third] = ["A", "B", "C"]
// first = "A", second = "B", third = "C"

// Skip elements:
const [first, , third] = ["A", "B", "C"]
// first = "A", third = "C" (skipped "B")
```

### **4. Spread Operator**

#### **Array Spread**
```javascript
// Add item to array
const newSeats = [...existingSeats, newSeat]

// Remove item from array
const filteredSeats = existingSeats.filter(seat => seat.id !== seatToRemove.id)

// Combine arrays
const allSeats = [...sectionASeats, ...sectionBSeats]
```

#### **Object Spread**
```javascript
// Copy object with changes
const updatedSeat = { ...seat, status: "sold" }

// Merge objects
const seatWithPrice = { ...seat, price: getPriceForTier(seat.priceTier) }
```

### **5. Template Literals**

```javascript
// String interpolation with variables
const message = `Seat ${seatId} is ${status}`
// Result: "Seat A-1-01 is available"

// Multi-line strings
const ariaLabel = `Seat ${seat.id} in section ${sectionId} row ${rowIndex}, ${status}, price tier ${priceTier}`
```

### **6. Arrow Functions**

```javascript
// Traditional function
function handleClick(seat) {
  return seat.id
}

// Arrow function (same thing)
const handleClick = (seat) => {
  return seat.id
}

// Arrow function with implicit return
const handleClick = (seat) => seat.id

// Arrow function with single parameter (no parentheses needed)
const handleClick = seat => seat.id
```

### **7. Conditional Rendering**

```javascript
// If statement
if (isSelected) {
  return <SelectedSeat />
} else {
  return <AvailableSeat />
}

// Ternary operator (shorter)
return isSelected ? <SelectedSeat /> : <AvailableSeat />

// Logical AND (show/hide)
return (
  <div>
    {isSelected && <SelectedIndicator />}
    <SeatComponent />
  </div>
)
```

---

## Performance Optimizations

### **1. React.memo - Prevent Unnecessary Re-renders**
```javascript
// Without memo - re-renders every time parent renders
function SeatComponent({ seat, isSelected }) {
  return <rect fill={isSelected ? "blue" : "green"} />
}

// With memo - only re-renders when props change
const SeatComponent = React.memo(function SeatComponent({ seat, isSelected }) {
  return <rect fill={isSelected ? "blue" : "green"} />
})
```

**Why memo?** With 15,000 seats, re-rendering all seats when one changes would be very slow.

### **2. Viewport Culling - Only Render Visible Seats**
```javascript
export function useVisibleSeats(venue, viewBox, scale) {
  return useMemo(() => {
    // Parse viewBox to get current viewport
    const [x, y, width, height] = viewBox.split(" ").map(Number)
    
    // Add buffer around viewport for smooth scrolling
    const buffer = Math.max(width, height) * 0.2
    const bufferedViewport = {
      x: x - buffer,
      y: y - buffer,
      width: width + buffer * 2,
      height: height + buffer * 2,
    }
    
    // Only include seats within buffered viewport
    const visibleSeats = []
    for (const section of venue.sections) {
      for (const row of section.rows) {
        for (const seat of row.seats) {
          const absoluteX = seat.x + section.transform.x
          const absoluteY = seat.y + section.transform.y
          
          if (
            absoluteX >= bufferedViewport.x &&
            absoluteX <= bufferedViewport.x + bufferedViewport.width &&
            absoluteY >= bufferedViewport.y &&
            absoluteY <= bufferedViewport.y + bufferedViewport.height
          ) {
            visibleSeats.push({ seat, sectionId: section.id, rowIndex: row.index })
          }
        }
      }
    }
    
    return { visibleSeats, totalSeats: venue.sections.reduce((total, section) => 
      total + section.rows.reduce((rowTotal, row) => rowTotal + row.seats.length, 0), 0
    )}
  }, [venue, viewBox, scale])
}
```

**Key Concepts:**
- **useMemo**: Only recalculates when dependencies change
- **Viewport Culling**: Only render what's visible on screen
- **Buffer Zone**: Render slightly more than visible for smooth scrolling
- **Coordinate Math**: Calculate absolute positions considering section transforms

### **3. Event Delegation - Efficient Event Handling**
```javascript
// Instead of adding click listener to each of 15,000 seats:
seats.forEach(seat => {
  seat.addEventListener('click', handleSeatClick)
})

// Add one listener to the parent SVG:
<svg onClick={handleSvgClick}>
  {seats.map(seat => <rect data-seat-id={seat.id} />)}
</svg>

const handleSvgClick = (e) => {
  const seatId = e.target.getAttribute('data-seat-id')
  if (seatId) {
    handleSeatClick(seatId)
  }
}
```

**Why Event Delegation?** One event listener instead of thousands = much better performance.

### **4. Debounced Updates - Batch WebSocket Updates**
```javascript
// Without debouncing - update UI for every WebSocket message
const handleWebSocketMessage = (message) => {
  updateSeatStatus(message.seatId, message.status) // Immediate update
}

// With debouncing - batch updates together
const [pendingUpdates, setPendingUpdates] = useState(new Map())

const handleWebSocketMessage = useCallback((message) => {
  setPendingUpdates(prev => new Map(prev).set(message.seatId, message.status))
}, [])

// Apply all updates at once every 100ms
useEffect(() => {
  const timer = setTimeout(() => {
    if (pendingUpdates.size > 0) {
      applyUpdates(pendingUpdates)
      setPendingUpdates(new Map())
    }
  }, 100)
  
  return () => clearTimeout(timer)
}, [pendingUpdates])
```

**Why Debouncing?** Prevents UI from updating too frequently, which can cause lag.

---

## Accessibility Implementation

### **1. ARIA Labels and Roles**
```javascript
// Screen readers announce this information
<rect
  role="button"
  aria-label={`Seat ${seat.id} in section ${sectionId} row ${rowIndex}, ${status}, price tier ${priceTier}`}
  aria-pressed={isSelected}
  aria-describedby={`seat-${seat.id}-description`}
  tabIndex={isInteractive ? 0 : -1}
/>

// Hidden description for more details
<desc id={`seat-${seat.id}-description`}>
  {`Seat ${seat.col} in section ${sectionId}, row ${rowIndex}. Status: ${status}. Price tier ${priceTier}.`}
  {isInteractive ? " Press Enter or Space to select." : " Not available for selection."}
</desc>
```

**Key Concepts:**
- **role="button"**: Tells screen reader this is clickable
- **aria-label**: Provides accessible name
- **aria-pressed**: Indicates if button is "pressed" (selected)
- **aria-describedby**: Links to additional description
- **tabIndex**: Controls keyboard navigation (0 = focusable, -1 = not focusable)

### **2. Keyboard Navigation**
```javascript
const handleKeyDown = (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    handleClick() // Select/deselect seat
  } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault()
    onSeatKeyDown(seat, sectionId, rowIndex, e.key) // Navigate to adjacent seat
  }
}
```

**Key Concepts:**
- **preventDefault()**: Stops browser's default behavior (like scrolling)
- **Arrow Keys**: Navigate between seats
- **Enter/Space**: Activate seat selection

### **3. Live Regions for Dynamic Updates**
```javascript
// Announce changes to screen readers
const { announce } = useAccessibility()

const handleSeatClick = (seat) => {
  const wasSelected = isSeatSelected(seat.id)
  toggleSeat(seat)
  announce(`Seat ${seat.id} ${wasSelected ? "deselected" : "selected"}`)
}

// Live region component
function LiveRegion({ message }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}
```

**Key Concepts:**
- **aria-live="polite"**: Screen reader announces changes when user isn't busy
- **aria-atomic="true"**: Announces entire message, not just changes
- **sr-only**: Visually hidden but available to screen readers

### **4. High Contrast and Reduced Motion Support**
```javascript
// Check user's accessibility preferences
const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
const [highContrast, setHighContrast] = useState(false)

useEffect(() => {
  // Check for reduced motion preference
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
  setPrefersReducedMotion(mediaQuery.matches)
  
  const handleChange = (e) => setPrefersReducedMotion(e.matches)
  mediaQuery.addEventListener("change", handleChange)
  
  return () => mediaQuery.removeEventListener("change", handleChange)
}, [])

// Use preferences in rendering
<rect
  className={cn(
    "transition-all duration-200",
    !prefersReducedMotion && isAnimating && "animate-bounce"
  )}
  fill={highContrast ? "#00FF00" : "#22c55e"}
/>
```

**Key Concepts:**
- **matchMedia()**: Check CSS media queries in JavaScript
- **prefers-reduced-motion**: Respects user's motion sensitivity
- **prefers-contrast**: Respects user's contrast needs
- **Conditional Classes**: Only apply animations if user wants them

---

## Testing Strategy

### **1. Unit Tests with Jest**
```javascript
// Test seat selection logic
describe('useSeatSelection', () => {
  test('should add seat to selection', () => {
    const { result } = renderHook(() => useSeatSelection())
    
    act(() => {
      result.current.toggleSeat(mockSeat)
    })
    
    expect(result.current.selection.seats).toHaveLength(1)
    expect(result.current.selection.seats[0].id).toBe(mockSeat.id)
  })
  
  test('should not exceed maximum seats', () => {
    const { result } = renderHook(() => useSeatSelection())
    
    // Add 8 seats
    for (let i = 0; i < 8; i++) {
      act(() => {
        result.current.toggleSeat({ ...mockSeat, id: `seat-${i}` })
      })
    }
    
    // Try to add 9th seat
    act(() => {
      result.current.toggleSeat({ ...mockSeat, id: 'seat-9' })
    })
    
    expect(result.current.selection.seats).toHaveLength(8)
  })
})
```

### **2. Integration Tests**
```javascript
// Test component interactions
describe('SeatingMap Integration', () => {
  test('should update selection when seat is clicked', async () => {
    render(<SeatingMapPage />)
    
    const seat = screen.getByLabelText(/seat A-1-01/)
    await user.click(seat)
    
    expect(screen.getByText('1/8 selected')).toBeInTheDocument()
  })
})
```

### **3. End-to-End Tests with Playwright**
```javascript
// Test complete user workflows
test('should allow user to select multiple seats', async ({ page }) => {
  await page.goto('/')
  
  // Click first seat
  await page.click('[data-seat-id="A-1-01"]')
  await expect(page.locator('text=1/8 selected')).toBeVisible()
  
  // Click second seat
  await page.click('[data-seat-id="A-1-03"]')
  await expect(page.locator('text=2/8 selected')).toBeVisible()
  
  // Verify seats are highlighted
  await expect(page.locator('[data-seat-id="A-1-01"]')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-seat-id="A-1-03"]')).toHaveAttribute('aria-pressed', 'true')
})
```

### **4. Accessibility Tests**
```javascript
// Test keyboard navigation
test('should navigate seats with arrow keys', async ({ page }) => {
  await page.goto('/')
  
  // Focus first seat
  await page.keyboard.press('Tab')
  await expect(page.locator('[data-seat-id="A-1-01"]')).toBeFocused()
  
  // Navigate right
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('[data-seat-id="A-1-02"]')).toBeFocused()
  
  // Select with Enter
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-seat-id="A-1-02"]')).toHaveAttribute('aria-pressed', 'true')
})
```

---

## Summary

This seating map application demonstrates many important JavaScript and React concepts:

### **Core JavaScript Concepts:**
- **Functions and Arrow Functions**: Event handlers, data transformation
- **Objects and Arrays**: Data structures for seats, sections, venues
- **Array Methods**: map, filter, reduce, find, some for data manipulation
- **Destructuring**: Clean code for extracting values from objects/arrays
- **Template Literals**: Dynamic string creation
- **Conditional Logic**: if/else, ternary operators, logical AND
- **Classes**: WebSocket service implementation
- **Async/Await**: Loading venue data

### **React Concepts:**
- **Components**: Reusable UI pieces (Seat, Section, Map)
- **Props**: Passing data between components
- **State**: Managing changing data (selections, zoom level)
- **Hooks**: useState, useEffect, useCallback, useMemo
- **Event Handling**: onClick, onKeyDown, onTouchStart
- **Conditional Rendering**: Showing/hiding elements based on state
- **Performance**: React.memo, viewport culling, event delegation

### **Advanced Concepts:**
- **TypeScript**: Type safety and better development experience
- **SVG**: Vector graphics for scalable seat rendering
- **WebSockets**: Real-time communication
- **Accessibility**: Screen reader support, keyboard navigation
- **Performance Optimization**: Memoization, culling, debouncing
- **Testing**: Unit, integration, and end-to-end tests

This project shows how modern web applications combine many technologies to create rich, interactive experiences that work for all users, including those with disabilities. Each concept builds on the others to create a cohesive, maintainable application.
