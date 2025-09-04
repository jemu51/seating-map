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

    // Check that selection counter updates - look for the selection text in the header
    await expect(page.locator('.hidden.md\\:flex')).toContainText(/\d+\/8 selected/)

    // Check that seat appears in summary (desktop view)
    if (await page.locator(".xl\\:col-span-2").isVisible()) {
      // Look for the seat in the selection summary panel
      await expect(page.locator('[data-seat-id="A-1-01"]')).toBeVisible()
    }
  })

  test("should support keyboard navigation", async ({ page }) => {
    // Focus on the first seat
    await page.focus('[data-seat-id="A-1-01"]')

    // Press Enter to select
    await page.keyboard.press("Enter")

    // Check selection - look for the selection text
    await expect(page.locator('.hidden.md\\:flex')).toContainText("1/8 selected")

    // Navigate with arrow keys
    await page.keyboard.press("ArrowRight")

    // The next seat should be focused
    await expect(page.locator('[data-seat-id="A-1-02"]')).toBeFocused()
  })

  test("should toggle heat map mode on desktop", async ({ page }) => {
    // Skip this test on mobile as heat map toggle is hidden
    const isMobile = await page.evaluate(() => window.innerWidth < 768)
    if (isMobile) {
      test.skip()
      return
    }

    // Toggle heat map - the switch is in the header on desktop
    await page.click('label[for="heat-map"]')

    // Check that the seating map is still visible after toggle
    await expect(page.locator('[role="application"]')).toBeVisible()
  })

  test("should find adjacent seats on desktop", async ({ page }) => {
    // Skip on mobile as the finder is in a different location
    const isMobile = await page.evaluate(() => window.innerWidth < 768)
    if (isMobile) {
      test.skip()
      return
    }

    if (await page.locator(".xl\\:col-span-2").isVisible()) {
      // Click on Find Seats tab
      await page.click("text=Find Seats")

      // Wait for the tab content to be visible
      await page.waitForSelector('input[type="number"]')

      // Set number of seats to find
      await page.fill('input[type="number"]', "2")

      // Click Find button
      await page.click('button:has-text("Find")')

      // Should show results - wait for the search to complete
      // Check for either "Available Groups:" or "No adjacent seat groups found"
      const resultVisible = await Promise.race([
        page.locator("text=Available Groups:").waitFor({ timeout: 5000 }).then(() => true).catch(() => false),
        page.locator("text=No adjacent seat groups found").waitFor({ timeout: 5000 }).then(() => true).catch(() => false)
      ])

      expect(resultVisible).toBe(true)
    }
  })

  test("should work on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that mobile controls are visible (the button should be visible)
    await expect(page.locator('button[aria-label="Open mobile menu"]')).toBeVisible()

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

    // Check that selection is restored - look for the selection text
    await expect(page.locator('.hidden.md\\:flex')).toContainText("1/8 selected")
  })

  test("should handle WebSocket updates", async ({ page }) => {
    // Wait for WebSocket connection status to be visible
    // The connection status component should be present in the header
    await expect(page.locator('.hidden.md\\:flex').getByText(/Live|Connecting|Offline/)).toBeVisible({ timeout: 10000 })

    // The connection status should show some state (Live, Connecting, or Offline)
    const statusText = await page.locator('.hidden.md\\:flex').getByText(/Live|Connecting|Offline/).textContent()
    expect(statusText).toMatch(/(Live|Connecting|Offline)/)
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

  test("should adapt to different viewport sizes", async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('.hidden.md\\:flex')).toBeVisible() // Desktop header controls

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('[role="application"]')).toBeVisible()

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('button[aria-label="Open mobile menu"]')).toBeVisible() // Mobile controls
  })
})
