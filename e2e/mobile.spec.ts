import { test, expect } from "@playwright/test"
import fs from 'fs'
import path from 'path'

let venueData: any

test.beforeAll(async () => {
  const venuePath = path.join(__dirname, '../public/venue.json')
  const venueFile = fs.readFileSync(venuePath, 'utf8')
  venueData = JSON.parse(venueFile)
})

test.describe("Mobile Seating Map Application", () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport for all tests
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/")
  })

  test("should load the venue and display seating map on mobile", async ({ page }) => {
    // Wait for the venue to load
    await expect(page.locator("h1")).toContainText("Metropolis Arena")

    // Check that the seating map is visible
    await expect(page.locator('[role="application"]')).toBeVisible()
  })

  test("should show mobile controls", async ({ page }) => {
    // Check that mobile controls are visible
    await expect(page.locator('button[aria-label="Open mobile menu"]')).toBeVisible()
  })

  test("should open mobile menu", async ({ page }) => {
    // Click on mobile menu
    await page.click('button[aria-label="Open mobile menu"]')

    // Check that mobile sheet opens
    await expect(page.locator("text=Seating Options")).toBeVisible()
  })

  test("should allow seat selection on mobile", async ({ page }) => {
    // Wait for seats to be rendered
    await page.waitForSelector('[data-seat-id="A-1-01"]')

    // Click on an available seat
    await page.click('[data-seat-id="A-1-01"]')

    // Check that selection counter updates - look for the selection text in mobile view
    // On mobile, the selection counter might be in a different location
    // Be more specific to get the visible selection counter
    await expect(page.locator('[aria-live="polite"]:not(.sr-only)')).toContainText(/\d+\/8 selected/)
  })

  test("should support touch interactions", async ({ page }) => {
    // Wait for seats to be rendered
    await page.waitForSelector('[data-seat-id="A-1-01"]')

    // Test touch interaction by clicking (simulating touch)
    await page.click('[data-seat-id="A-1-01"]')

    // Verify the seat was selected - seats use aria-pressed instead of aria-selected
    await expect(page.locator('[data-seat-id="A-1-01"]')).toHaveAttribute('aria-pressed', 'true')
  })

  test("should handle mobile menu navigation", async ({ page }) => {
    // Open mobile menu
    await page.click('button[aria-label="Open mobile menu"]')

    // Check that all menu options are available
    await expect(page.locator("text=Select Venue")).toBeVisible()
    await expect(page.locator("text=My Selection")).toBeVisible()
    await expect(page.locator("text=Find Adjacent Seats")).toBeVisible()
    // Be more specific for Event Info to avoid multiple matches
    await expect(page.locator("text=Event Information")).toBeVisible()
  })

  test("should be accessible on mobile", async ({ page }) => {
    // Check for skip links
    await page.keyboard.press("Tab")
    await expect(page.locator("text=Skip to main content")).toBeVisible()

    // Check ARIA labels
    await expect(page.locator('[aria-label*="Seat A-1-01"]')).toBeVisible()

    // Check that the seating map has proper role
    await expect(page.locator('[role="application"]')).toBeVisible()
  })

  test("should handle mobile viewport resizing", async ({ page }) => {
    // Test different mobile viewport sizes
    await page.setViewportSize({ width: 320, height: 568 }) // iPhone SE
    await expect(page.locator('[role="application"]')).toBeVisible()

    await page.setViewportSize({ width: 414, height: 896 }) // iPhone 11 Pro Max
    await expect(page.locator('[role="application"]')).toBeVisible()
  })

  test("should persist selection after page reload on mobile", async ({ page }) => {
    // Select a seat
    await page.click('[data-seat-id="A-1-01"]')

    // Reload the page
    await page.reload()

    // Wait for the page to load
    await page.waitForSelector('[data-seat-id="A-1-01"]')

    // Check that selection is restored
    // Be more specific to get the visible selection counter
    await expect(page.locator('[aria-live="polite"]:not(.sr-only)')).toContainText("1/8 selected")
  })

  test("should handle mobile keyboard navigation", async ({ page }) => {
    // Focus on the first seat
    await page.focus('[data-seat-id="A-1-01"]')

    // Press Enter to select
    await page.keyboard.press("Enter")

    // Check selection
    // Be more specific to get the visible selection counter
    await expect(page.locator('[aria-live="polite"]:not(.sr-only)')).toContainText("1/8 selected")

    // Navigate with arrow keys
    await page.keyboard.press("ArrowRight")

    // The next seat should be focused
    await expect(page.locator('[data-seat-id="A-1-02"]')).toBeFocused()
  })
})
