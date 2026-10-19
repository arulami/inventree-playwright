import { type Page, expect } from '@playwright/test'

export class HomePage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('/web/home')
    await expect(this.page).toHaveTitle('InvenTree Demo Server | Dashboard')
  }

  async openParts() {
    await this.page.getByRole('tablist').getByRole('link', { name: 'Parts' }).click()
    await expect(this.page).toHaveURL(/\/web\/part\//)
  }
}
