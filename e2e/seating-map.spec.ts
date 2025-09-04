import { test, expect } from "@playwright/test"
import fs from 'fs'
import path from 'path'

let venueData: any

test.beforeAll(async () => {
  const venuePath = path.join(__dirname, '../public/venue.json')
  const venueFile = fs.readFileSync(venuePath, 'utf8')
  venueData = JSON.parse(venueFile)
})

test.describe("Seating Map Application", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("should load the venue and display seating map", async ({ page }) => {
    // Wait for the venue to load
    await expect(page.locator("h1")).toContainText("Metropolis Arena")

    // Check that the seating map is visible
    await expect(page.locator('[role="application"]')).toBeVisible()

  })

  test("should allow seat selection", async ({ page }) => {
    // Wait for seats to be rendered
    await page.waitForSelector('[data-seat-id="A-1-01"]')

    // Click on an available seat
    await page.click('[data-seat-id="A-1-01"]')

    // Check that selection counter updates (use regex to match any number)
    await expect(page.locator("text=/\\d+\\/8 selected/")).toBeVisible()

    // Check that seat appears in summary (desktop view)
    if (await page.locator(".xl\\:col-span-2").isVisible()) {
      await expect(page.locator("text=A-1-01")).toBeVisible()
    }
  })

  test("should support keyboard navigation", async ({ page }) => {
    // Focus on the first seat
    await page.focus('[data-seat-id="A-1-01"]')

    // Press Enter to select
    await page.keyboard.press("Enter")

    // Check selection
    await expect(page.locator("text=1/8 selected")).toBeVisible()

    // Navigate with arrow keys
    await page.keyboard.press("ArrowRight")

    // The next seat should be focused
    await expect(page.locator('[data-seat-id="A-1-02"]')).toBeFocused()
  })

  test("should toggle heat map mode", async ({ page }) => {
    // Toggle heat map
    await page.click('label[for="heat-map"]')

    // Check that legend changes
    await expect(page.locator("text=Price Tiers")).toBeVisible()
    await expect(page.locator("text=Tier 1 ($150)")).toBeVisible()
  })

  test("should find adjacent seats", async ({ page }) => {
    // Skip on mobile as the finder is in a different location
    if (await page.locator(".xl\\:col-span-2").isVisible()) {
      // Click on Find Seats tab
      await page.click("text=Find Seats")

      // Set number of seats to find
      await page.fill('input[type="number"]', "2")

      // Click Find button
      await page.click('button:has-text("Find")')

      // Should show results
      await expect(page.locator("text=Available Groups:")).toBeVisible()
    }
  })

  test("should work on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that mobile controls are visible
    await expect(page.locator(".md\\:hidden")).toBeVisible()

    // Click on mobile menu
    await page.click('button[aria-label="Open mobile menu"]')

    // Check that mobile sheet opens
    await expect(page.locator("text=Seating Options")).toBeVisible()
  })

  test("should persist selection after page reload", async ({ page }) => {
    // Select a seat
    await page.click('[data-seat-id="A-1-01"]')

    // Reload the page
    await page.reload()

    // Wait for the page to load
    await page.waitForSelector('[data-seat-id="A-1-01"]')

    // Check that selection is restored
    await expect(page.locator("text=1/8 selected")).toBeVisible()
  })

  test("should handle WebSocket updates", async ({ page }) => {
    // Wait for WebSocket connection
    await expect(page.locator("text=Live")).toBeVisible({ timeout: 10000 })

    // The mock WebSocket should send updates
    // We can't easily test the actual updates, but we can verify the connection status
    await expect(page.locator('[class*="bg-green-500"]')).toBeVisible()
  })

  test("should be accessible", async ({ page }) => {
    // Check for skip links
    await page.keyboard.press("Tab")
    await expect(page.locator("text=Skip to main content")).toBeVisible()

    // Check ARIA labels
    await expect(page.locator('[aria-label*="Seat A-1-01"]')).toBeVisible()

    // Check that the seating map has proper role
    await expect(page.locator('[role="application"]')).toBeVisible()
  })
})
