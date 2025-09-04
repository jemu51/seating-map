# E2E Testing Suite

This directory contains a comprehensive end-to-end testing suite for the seating map application, designed to ensure functionality works correctly across all devices, browsers, and viewport sizes.

## Test Files Overview

### 📁 `seating-map.spec.ts` - Core Functionality Tests
**Purpose**: Tests the main seating map application features and user interactions.

**Tests included**:
- **Venue Loading**: Verifies the venue loads correctly and displays the seating map
- **Seat Selection**: Tests clicking on seats and verifies selection counter updates
- **Keyboard Navigation**: Tests arrow key navigation and Enter key selection
- **Heat Map Toggle**: Tests the heat map mode toggle (desktop only)
- **Adjacent Seat Finder**: Tests the finder functionality for locating consecutive seats
- **Mobile Viewport**: Verifies mobile controls appear and work correctly
- **Selection Persistence**: Tests that selections persist after page reload
- **WebSocket Updates**: Verifies real-time connection status and updates
- **Accessibility**: Tests skip links, ARIA labels, and proper roles
- **Responsive Design**: Tests UI adaptation across different viewport sizes

### 📁 `mobile.spec.ts` - Mobile-Specific Tests
**Purpose**: Dedicated tests for mobile functionality and touch interactions.

**Tests included**:
- **Mobile Venue Loading**: Verifies venue loads correctly on mobile devices
- **Mobile Controls**: Tests visibility and functionality of mobile menu button
- **Mobile Menu**: Tests opening/closing the mobile menu sheet
- **Mobile Seat Selection**: Tests seat selection on mobile viewports
- **Touch Interactions**: Verifies touch-based seat selection works correctly
- **Mobile Menu Navigation**: Tests all menu options (Select Venue, My Selection, Find Adjacent Seats, Event Information)
- **Mobile Accessibility**: Tests accessibility features on mobile devices
- **Mobile Viewport Resizing**: Tests different mobile screen sizes (iPhone SE, iPhone 8, iPhone 11 Pro Max)
- **Mobile Selection Persistence**: Tests selection persistence on mobile after reload
- **Mobile Keyboard Navigation**: Tests keyboard navigation on mobile devices

### 📁 `accessibility.spec.ts` - Accessibility Compliance Tests
**Purpose**: Ensures the application meets accessibility standards and works with assistive technologies.

**Tests included**:
- **Heading Structure**: Verifies proper heading hierarchy (h1, h2, h3, etc.)
- **Focus Management**: Tests tab navigation and focus indicators
- **ARIA Labels**: Verifies proper ARIA labels on interactive elements
- **Selection Announcements**: Tests live region announcements for seat selection changes
- **High Contrast Mode**: Tests functionality with high contrast and reduced motion preferences
- **Cross-Viewport Accessibility**: Tests accessibility features across different screen sizes
- **Screen Reader Support**: Tests screen reader announcements and hidden content

### 📁 `responsive.spec.ts` - Responsive Design Tests
**Purpose**: Tests how the application adapts to different viewport sizes and devices.

**Tests included**:
- **UI Element Adaptation**: Tests how UI elements adapt across viewport sizes
- **Seat Selection Across Viewports**: Tests seat selection functionality on mobile and desktop
- **Control Visibility**: Verifies appropriate controls show/hide based on viewport
- **Accessibility Across Viewports**: Tests accessibility features work on all screen sizes
- **Keyboard Navigation Consistency**: Tests keyboard navigation works consistently across devices
- **Feature Skipping**: Tests that desktop-only features are properly skipped on mobile

### 📁 `utils/responsive-test.ts` - Responsive Testing Utilities
**Purpose**: Provides helper functions and utilities for responsive testing.

**Features**:
- **Viewport Configurations**: Predefined viewport sizes for different devices
- **ResponsiveTestHelper Class**: Helper methods for responsive testing
- **Viewport Detection**: Methods to detect mobile, tablet, and desktop viewports
- **Cross-Viewport Testing**: Utilities for testing functionality across multiple viewports
- **Element Visibility Assertions**: Methods to assert element visibility based on viewport

## Test Projects & Browsers

The Playwright configuration defines separate test projects for different browsers and devices:

### 🖥️ Desktop Browsers
- **`desktop-chromium`**: Chrome desktop tests
- **`desktop-firefox`**: Firefox desktop tests  
- **`desktop-webkit`**: Safari desktop tests

### 📱 Mobile Browsers
- **`mobile-chrome`**: Chrome mobile tests (Pixel 5 viewport)
- **`mobile-safari`**: Safari mobile tests (iPhone 12 viewport)

### ♿ Accessibility
- **`accessibility`**: Cross-platform accessibility tests

## Viewport Configurations

The test suite supports multiple viewport sizes:

| Device | Width | Height | Name |
|--------|-------|--------|------|
| iPhone SE | 320 | 568 | Mobile Small |
| iPhone 8 | 375 | 667 | Mobile Medium |
| iPhone 11 Pro Max | 414 | 896 | Mobile Large |
| iPad | 768 | 1024 | Tablet |
| Desktop Small | 1024 | 768 | Desktop Small |
| Desktop Medium | 1440 | 900 | Desktop Medium |
| Desktop Large | 1920 | 1080 | Desktop Large |

## Running Tests

### Available Scripts

```bash
# Run all tests across all browsers
pnpm test:e2e:all

# Run desktop tests only (Chrome, Firefox, Safari)
pnpm test:e2e:desktop

# Run mobile tests only (Chrome Mobile, Safari Mobile)
pnpm test:e2e:mobile

# Run accessibility tests only
pnpm test:e2e:accessibility

# Run with UI for debugging
pnpm test:e2e:ui

# Run in headed mode (visible browser)
pnpm test:e2e:headed
```

### Running Specific Tests

```bash
# Run a specific test by name
pnpm exec playwright test --grep "should allow seat selection"

# Run tests from a specific file
pnpm exec playwright test seating-map.spec.ts

# Run tests on a specific browser
pnpm exec playwright test --project=desktop-chromium
```

## Test Strategy

### Responsive Testing Approach

1. **Skip Mobile-Specific Tests**: Tests that don't apply to mobile UI are automatically skipped
2. **Separate Mobile Test Suites**: Mobile-specific functionality tested in dedicated files
3. **Responsive Test Utilities**: Helper utilities for complex responsive testing
4. **Cross-Viewport Validation**: Tests functionality across all supported viewport sizes

### Best Practices

1. **Viewport-Specific Selectors**: Use responsive CSS classes for element selection
2. **Conditional Testing**: Test features only where they're available
3. **Accessibility Across Viewports**: Ensure accessibility features work on all devices
4. **Proper Error Handling**: Use appropriate timeouts and retry logic

### Element Selection Examples

```typescript
// Desktop selection counter
await expect(page.locator('.hidden.md\\:flex')).toContainText(/\d+\/8 selected/)

// Mobile selection counter
await expect(page.locator('[aria-live="polite"]:not(.sr-only)')).toContainText(/\d+\/8 selected/)

// Viewport-specific elements
await expect(page.locator('button[aria-label="Open mobile menu"]')).toBeVisible() // Mobile only
await expect(page.locator('label[for="heat-map"]')).toBeVisible() // Desktop only
```

## Troubleshooting

### Common Issues

1. **Multiple Element Matches**: Use more specific selectors
   ```typescript
   // Instead of: page.locator('[aria-live="polite"]')
   // Use: page.locator('[aria-live="polite"]:not(.sr-only)')
   ```

2. **Hidden Elements**: Check viewport-specific visibility
   ```typescript
   await helper.assertResponsiveVisibility('selector', true, 'desktop')
   ```

3. **Timing Issues**: Add appropriate waits
   ```typescript
   await page.waitForSelector('[data-seat-id="A-1-01"]')
   await page.waitForTimeout(100) // For layout changes
   ```

### Debugging

Use the UI mode for interactive debugging:

```bash
pnpm test:e2e:ui
```

This opens Playwright's test runner UI where you can:
- Step through tests
- Inspect elements
- View screenshots and videos
- Debug responsive behavior

## Test Results

The test suite generates comprehensive reports:
- **HTML Report**: Detailed test results with screenshots and traces
- **Error Context**: Detailed error information for failed tests
- **Performance Metrics**: Test execution times and performance data

## Coverage Summary

- **Total Tests**: 96 tests across all browsers and viewports
- **Core Functionality**: Seat selection, navigation, venue loading
- **Mobile Features**: Touch interactions, mobile menu, responsive design
- **Accessibility**: ARIA compliance, screen reader support, keyboard navigation
- **Cross-Browser**: Chrome, Firefox, Safari (desktop and mobile)
- **Responsive Design**: All viewport sizes from mobile to desktop

This comprehensive testing suite ensures the seating map application works correctly across all devices, browsers, and accessibility requirements.
