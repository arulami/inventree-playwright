import { type Page, expect } from '@playwright/test'

export class PartDetailPage {
  constructor(private page: Page) {}

  async expectPartDetails({ name, description, categoryName }: { name: string, description: string, categoryName: string }) {
    await expect(this.page).toHaveTitle(`InvenTree Demo Server | Part: ${name}`)
    await expect(this.page.getByRole('row', { name: `Name ${name}`, exact: true })).toBeVisible()
    await expect(this.page.getByRole('row', { name: `Description ${description}`, exact: true })).toBeVisible()
    await expect(this.page.getByRole('row', { name: `Category ${categoryName}`, exact: true })).toBeVisible()
  }
}
