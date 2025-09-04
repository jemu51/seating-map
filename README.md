# Interactive Event Seating Map

A React + TypeScript application that renders an interactive seating map for events. Built with Next.js 15, featuring real-time seat updates, accessibility compliance, and mobile-first design.

## Core Requirements Implementation

### 1. Load venue.json and render every seat in correct position
**Implementation**: SVG-based rendering system with absolute positioning
- **File**: `components/seating-map/seating-map.tsx`
- **Description**: Uses SVG for crisp rendering at any zoom level, with seats positioned using absolute coordinates from venue data
- **Performance**: Optimized with React.memo for smooth rendering

### 2. Keep rendering smooth for large arenas
**Implementation**: Performance optimizations with memoization
- **Files**: `components/seating-map/seat.tsx`, `lib/performance-utils.ts`
- **Description**: Implements React.memo usage and efficient event delegation for performance
- **Note**: Viewport culling utilities exist but are not currently implemented

### 3. Seat selection via mouse click AND keyboard
**Implementation**: Dual input support with comprehensive keyboard navigation
- **Files**: `components/seating-map/seat.tsx`, `hooks/use-seat-selection.ts`
- **Description**: Mouse click handlers with keyboard support (Enter/Space to select, Arrow keys for navigation)
- **Accessibility**: Full keyboard navigation between seats with visual focus indicators

### 4. Display seat details on click or focus
**Implementation**: Real-time seat information panel
- **File**: `app/page.tsx` (seat details panel in desktop sidebar)
- **Description**: Shows section, row, seat number, price, status, and tier information
- **Features**: Live status updates, price calculation, and selection state

### 5. Allow selecting up to 8 seats with live summary
**Implementation**: Seat selection management with live updates
- **Files**: `hooks/use-seat-selection.ts`, `components/seat-summary-panel.tsx`
- **Description**: Enforces 8-seat limit with real-time subtotal calculation and selection summary
- **Features**: Individual seat removal, bulk selection, and clear all functionality

### 6. Persist selection after page reload (localStorage)
**Implementation**: Automatic persistence with error handling
- **File**: `hooks/use-seat-selection.ts` (localStorage implementation)
- **Description**: Saves selection to localStorage on every change, loads on mount with validation
- **Features**: Graceful error handling for corrupted data, automatic cleanup

### 7. Basic accessibility (aria-label, focus outline, keyboard navigation)
**Implementation**: Comprehensive accessibility system
- **Files**: `hooks/use-accessibility.ts`, `components/accessibility/`
- **Description**: Screen reader support, keyboard navigation, and high contrast mode
- **Features**: Live announcements, skip links, focus management, and reduced motion support

### 8. UI must work on desktop and mobile viewport sizes
**Implementation**: Responsive design with mobile-specific controls
- **Files**: `components/mobile/mobile-controls.tsx`, `app/page.tsx`
- **Description**: Mobile-first design with touch gestures, responsive layout, and mobile-specific UI patterns
- **Features**: Touch pan/zoom, mobile sheet dialogs, and adaptive controls

## Additional Features Implemented

### Real-time WebSocket Updates
**Why Added**: Enhances user experience with live seat status updates
- **Files**: `lib/websocket-service.ts`, `hooks/use-websocket-updates.ts`, `websocket-server.js`
- **Description**: WebSocket server for live seat status updates with reconnection logic and conflict resolution
- **Features**: Automatic reconnection, heartbeat monitoring, and optimistic UI updates

### Heat Map Toggle
**Why Added**: Helps users visualize price distribution across the venue
- **File**: `app/page.tsx` (heat map toggle in header)
- **Description**: Toggle between seat status view and price tier heat map
- **Features**: Color-coded legend, smooth transitions, and accessibility support

### Find Adjacent Seats Helper
**Why Added**: Improves user experience for group bookings
- **Files**: `components/adjacent-seat-finder.tsx`, `lib/seat-finder.ts`
- **Description**: Algorithm to find available adjacent seat groups of specified size
- **Features**: Smart search algorithm, price calculation, and one-click selection

### Pinch-zoom and Pan for Mobile
**Why Added**: Essential for mobile usability with large seating maps
- **File**: `components/seating-map/seating-map.tsx` (touch gesture handlers)
- **Description**: Touch gesture support for zoom and pan operations
- **Features**: Two-finger pinch zoom, single-finger pan, and gesture recognition

### Dark Mode Toggle
**Why Added**: Improves accessibility and user preference support
- **Files**: `components/theme-toggle.tsx`, `components/theme-provider.tsx`
- **Description**: System preference detection with manual toggle and localStorage persistence
- **Features**: Smooth transitions and preference memory

### End-to-End Testing
**Why Added**: Ensures reliability and accessibility compliance
- **Files**: `e2e/seating-map.spec.ts`, `e2e/accessibility.spec.ts`
- **Description**: Comprehensive Playwright tests covering core functionality and accessibility
- **Coverage**: Seat selection, keyboard navigation, mobile interactions, and accessibility features

### Advanced Accessibility Features
**Why Added**: Exceeds basic requirements for better inclusivity
- **Files**: `components/accessibility/live-region.tsx`, `components/accessibility/skip-links.tsx`
- **Description**: Screen reader announcements, skip navigation, and high contrast mode
- **Features**: Live region updates, keyboard shortcuts, and reduced motion support

## Requirements Fulfillment Status

✅ **All Core Requirements Met**:
1. ✅ Load venue.json and render seats in correct positions
2. ✅ Smooth rendering for large arenas
3. ✅ Mouse click AND keyboard selection support
4. ✅ Seat details display on click/focus
5. ✅ Up to 8 seats selection with live summary
6. ✅ Selection persistence after page reload
7. ✅ Basic accessibility (aria-label, focus, keyboard)
8. ✅ Desktop and mobile viewport support

✅ **All Optional Stretch Goals Implemented**:
1. ✅ Live seat-status updates over WebSocket with animations
2. ✅ Heat-map toggle coloring seats by price tier
3. ✅ "Find N adjacent seats" helper button
4. ✅ Pinch-zoom + pan for mobile (touch gestures)
5. ✅ Dark-mode toggle with theme persistence
6. ✅ End-to-end tests with Playwright

## Getting Started

### Prerequisites
- Node.js 22+ 
- pnpm (recommended) or npm

### Installation & Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

### Running with WebSocket Server (Optional)
```bash
# Start WebSocket server for real-time updates
pnpm websocket-server

# Or run both frontend and WebSocket server
pnpm dev:full
```

### Testing
```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

### Building for Production
```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Technical Architecture

### Core Technologies
- **Next.js 15** with App Router for modern React features
- **React 19** with TypeScript 5 and strict mode enabled
- **Tailwind CSS 4** for styling and responsive design
- **Radix UI** for accessible component primitives
- **WebSocket** for real-time updates

### Key Design Decisions
- **SVG over Canvas**: Better accessibility and DOM integration
- **Custom Hooks**: Business logic abstraction for reusability
- **Component Composition**: Modular architecture for maintainability
- **Performance Optimizations**: React.memo and efficient event handling
- **Accessibility First**: Comprehensive accessibility features throughout

### File Structure
```
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── accessibility/     # A11y-specific components
│   ├── mobile/            # Mobile-specific components
│   ├── seating-map/       # Core seating map components
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and services
├── e2e/                   # End-to-end tests
├── __tests__/             # Unit tests
└── public/                # Static assets and venue data
```

## Browser Support
- **Desktop**: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
- **Mobile**: iOS Safari 17+, Chrome Mobile 120+, Samsung Internet 120+
- **Accessibility**: Screen readers (NVDA, JAWS, VoiceOver), keyboard-only navigation

## Performance Notes
- **Large Venues**: The application supports venues with thousands of seats
- **Performance Optimizations**: React.memo and efficient event handling implemented
- **Future Improvements**: Viewport culling utilities available for potential performance enhancements