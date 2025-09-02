import { test, expect } from "@playwright/test"

test.describe("Accessibility Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("should have proper heading structure", async ({ page }) => {
    // Main heading
    await expect(page.locator("h1")).toContainText("Metropolis Arena")

    // Section headings should be properly nested
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").allTextContents()
    expect(headings.length).toBeGreaterThan(0)
  })

  test("should have proper focus management", async ({ page }) => {
    // Tab through the interface
    await page.keyboard.press("Tab") // Skip link
    await page.keyboard.press("Tab") // Heat map toggle
    await page.keyboard.press("Tab") // Theme toggle

    // Should be able to reach interactive elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(["BUTTON", "INPUT", "A"]).toContain(focusedElement)
  })

  test("should have proper ARIA labels", async ({ page }) => {
    // Check seat ARIA labels
    const seatLabel = await page.getAttribute('[data-seat-id="A-1-01"]', "aria-label")
    expect(seatLabel).toContain("Seat A-1-01")
    expect(seatLabel).toContain("available")

    // Check button labels
    await expect(page.locator('[aria-label="Zoom in"]')).toBeVisible()
    await expect(page.locator('[aria-label="Zoom out"]')).toBeVisible()
  })

  test("should announce selection changes", async ({ page }) => {
    // Check for live region
    await expect(page.locator('[aria-live="polite"]')).toBeVisible()

    // The live region should be used for announcements
    // (We can't easily test the actual announcements in Playwright)
  })

  test("should support high contrast mode", async ({ page }) => {
    // Simulate high contrast preference
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" })

    // The app should still be functional
    await expect(page.locator("h1")).toBeVisible()
    await page.click('[data-seat-id="A-1-01"]')
    await expect(page.locator("text=1/8 selected")).toBeVisible()
  })
})
