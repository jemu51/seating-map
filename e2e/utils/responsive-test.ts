import { Page, expect } from '@playwright/test'

export interface ViewportConfig {
  width: number
  height: number
  name: string
}

export const VIEWPORTS = {
  MOBILE_SMALL: { width: 320, height: 568, name: 'Mobile Small (iPhone SE)' },
  MOBILE_MEDIUM: { width: 375, height: 667, name: 'Mobile Medium (iPhone 8)' },
  MOBILE_LARGE: { width: 414, height: 896, name: 'Mobile Large (iPhone 11 Pro Max)' },
  TABLET: { width: 768, height: 1024, name: 'Tablet (iPad)' },
  DESKTOP_SMALL: { width: 1024, height: 768, name: 'Desktop Small' },
  DESKTOP_MEDIUM: { width: 1440, height: 900, name: 'Desktop Medium' },
  DESKTOP_LARGE: { width: 1920, height: 1080, name: 'Desktop Large' },
} as const

export class ResponsiveTestHelper {
  constructor(private page: Page) { }

  /**
   * Set viewport and wait for layout to stabilize
   */
  async setViewport(viewport: ViewportConfig) {
    await this.page.setViewportSize({ width: viewport.width, height: viewport.height })
    // Wait for any layout changes to complete
    await this.page.waitForTimeout(100)
  }

  /**
   * Check if current viewport is mobile
   */
  async isMobile(): Promise<boolean> {
    return await this.page.evaluate(() => window.innerWidth < 768)
  }

  /**
   * Check if current viewport is tablet
   */
  async isTablet(): Promise<boolean> {
    const width = await this.page.evaluate(() => window.innerWidth)
    return width >= 768 && width < 1024
  }

  /**
   * Check if current viewport is desktop
   */
  async isDesktop(): Promise<boolean> {
    return await this.page.evaluate(() => window.innerWidth >= 1024)
  }

  /**
   * Skip test if not on the specified viewport type
   */
  async skipIfNot(viewportType: 'mobile' | 'tablet' | 'desktop') {
    let isCorrectType = false
    if (viewportType === 'mobile') {
      isCorrectType = await this.isMobile()
    } else if (viewportType === 'tablet') {
      isCorrectType = await this.isTablet()
    } else if (viewportType === 'desktop') {
      isCorrectType = await this.isDesktop()
    }

    if (!isCorrectType) {
      throw new Error(`Test skipped: Expected ${viewportType} viewport`)
    }
  }

  /**
   * Test functionality across different viewport sizes
   */
  async testAcrossViewports(
    testFunction: (viewport: ViewportConfig) => Promise<void>,
    viewports: ViewportConfig[] = Object.values(VIEWPORTS)
  ) {
    for (const viewport of viewports) {
      await this.setViewport(viewport)
      await testFunction(viewport)
    }
  }

  /**
   * Get element that should be visible based on viewport
   */
  async getResponsiveElement(selector: string, viewportType: 'mobile' | 'tablet' | 'desktop' | 'all' = 'all') {
    if (viewportType === 'all') {
      return this.page.locator(selector)
    }

    let isCorrectType = false
    if (viewportType === 'mobile') {
      isCorrectType = await this.isMobile()
    } else if (viewportType === 'tablet') {
      isCorrectType = await this.isTablet()
    } else if (viewportType === 'desktop') {
      isCorrectType = await this.isDesktop()
    }

    if (isCorrectType) {
      return this.page.locator(selector)
    }

    return null
  }

  /**
   * Assert element visibility based on viewport
   */
  async assertResponsiveVisibility(
    selector: string,
    expectedVisible: boolean,
    viewportType: 'mobile' | 'tablet' | 'desktop' | 'all' = 'all'
  ) {
    const element = await this.getResponsiveElement(selector, viewportType)
    if (element) {
      if (expectedVisible) {
        await expect(element).toBeVisible()
      } else {
        await expect(element).toBeHidden()
      }
    }
  }
}

/**
 * Helper function to create responsive test helper
 */
export function createResponsiveTestHelper(page: Page): ResponsiveTestHelper {
  return new ResponsiveTestHelper(page)
}
