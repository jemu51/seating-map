import { test, expect } from "@playwright/test"
import { createResponsiveTestHelper, VIEWPORTS } from "./utils/responsive-test"

test.describe("Responsive Seating Map Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("should adapt UI elements to different viewport sizes", async ({ page }) => {
    const helper = createResponsiveTestHelper(page)

    await helper.testAcrossViewports(async (viewport) => {
      console.log(`Testing on ${viewport.name}`)

      // Basic functionality should work on all viewports
      await expect(page.locator('[role="application"]')).toBeVisible()
      await expect(page.locator("h1")).toContainText("Metropolis Arena")

      // Desktop-specific elements
      if (await helper.isDesktop()) {
        await expect(page.locator('.hidden.md\\:flex')).toBeVisible() // Desktop header controls
        await expect(page.locator('label[for="heat-map"]')).toBeVisible() // Heat map toggle
      }

      // Mobile-specific elements
      if (await helper.isMobile()) {
        await expect(page.locator('button[aria-label="Open mobile menu"]')).toBeVisible() // Mobile menu button
      }

      // Tablet should have some desktop elements but not all
      if (await helper.isTablet()) {
        await expect(page.locator('[role="application"]')).toBeVisible()
      }
    })
  })

  test("should handle seat selection across viewports", async ({ page }) => {
    const helper = createResponsiveTestHelper(page)

    // Test on mobile viewport
    await helper.setViewport(VIEWPORTS.MOBILE_MEDIUM)
    await page.waitForSelector('[data-seat-id="A-1-01"]')
    await page.click('[data-seat-id="A-1-01"]')
    // Be more specific to get the visible selection counter
    await expect(page.locator('[aria-live="polite"]:not(.sr-only)')).toContainText(/\d+\/8 selected/)

    // Test on desktop viewport
    await helper.setViewport(VIEWPORTS.DESKTOP_LARGE)
    await page.waitForSelector('[data-seat-id="A-1-02"]')
    await page.click('[data-seat-id="A-1-02"]')
    await expect(page.locator('.hidden.md\\:flex')).toContainText(/\d+\/8 selected/)
  })

  test("should show appropriate controls for each viewport", async ({ page }) => {
    const helper = createResponsiveTestHelper(page)

    // Mobile viewport
    await helper.setViewport(VIEWPORTS.MOBILE_SMALL)
    await helper.assertResponsiveVisibility('button[aria-label="Open mobile menu"]', true, 'mobile')
    await helper.assertResponsiveVisibility('.hidden.md\\:flex', false, 'mobile')

    // Desktop viewport
    await helper.setViewport(VIEWPORTS.DESKTOP_LARGE)
    await helper.assertResponsiveVisibility('button[aria-label="Open mobile menu"]', false, 'desktop')
    await helper.assertResponsiveVisibility('.hidden.md\\:flex', true, 'desktop')
  })

  test("should maintain accessibility across viewports", async ({ page }) => {
    const helper = createResponsiveTestHelper(page)

    await helper.testAcrossViewports(async () => {
      // Accessibility features should work on all viewports
      await expect(page.locator('[role="application"]')).toBeVisible()
      await expect(page.locator('[aria-label*="Seat A-1-01"]')).toBeVisible()
      // Be more specific to avoid multiple matches
      await expect(page.locator('[aria-live="polite"]').first()).toBeVisible()
    })
  })

  test("should handle keyboard navigation consistently", async ({ page }) => {
    const helper = createResponsiveTestHelper(page)

    // Test keyboard navigation on desktop
    await helper.setViewport(VIEWPORTS.DESKTOP_MEDIUM)
    await page.focus('[data-seat-id="A-1-01"]')
    await page.keyboard.press("Enter")
    await expect(page.locator('.hidden.md\\:flex')).toContainText("1/8 selected")

    // Test keyboard navigation on mobile
    await helper.setViewport(VIEWPORTS.MOBILE_MEDIUM)
    await page.focus('[data-seat-id="A-1-02"]')
    await page.keyboard.press("Enter")
    // Be more specific to get the visible selection counter
    await expect(page.locator('[aria-live="polite"]:not(.sr-only)')).toContainText(/\d+\/8 selected/)
  })

  test("should skip desktop-only features on mobile", async ({ page }) => {
    const helper = createResponsiveTestHelper(page)

    // Test heat map toggle (desktop only)
    await helper.setViewport(VIEWPORTS.DESKTOP_LARGE)
    if (await helper.isDesktop()) {
      await page.click('label[for="heat-map"]')
      await expect(page.locator('[role="application"]')).toBeVisible()
    }

    // Test mobile menu (mobile only)
    await helper.setViewport(VIEWPORTS.MOBILE_MEDIUM)
    if (await helper.isMobile()) {
      await page.click('button[aria-label="Open mobile menu"]')
      await expect(page.locator("text=Seating Options")).toBeVisible()
    }
  })
})
