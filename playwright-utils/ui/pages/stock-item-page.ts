import { type Page, expect } from '@playwright/test'

export class StockItemPage {
  constructor(private page: Page) {}

  async expectStockItem({ partName, quantity, locationName }: { partName: string, quantity: number, locationName: string }) {
    await expect(this.page.getByRole('row', { name: `Base Part ${partName}`, exact: true })).toBeVisible()
    await expect(this.page.getByRole('row', { name: `Quantity ${quantity}`, exact: true })).toBeVisible()
    await expect(this.page.getByRole('row', { name: `Location ${locationName}`, exact: true })).toBeVisible()
  }

  async openBasePart(partName: string) {
    await this.page.getByRole('row', { name: `Base Part ${partName}`, exact: true }).getByRole('link', { name: partName, exact: true }).click()
    // The part opens on the panel last used for it (e.g. Stock), not always Part Details
    await expect(this.page).toHaveURL(/\/web\/part\/\d+\/[a-z-]+$/)
  }
}
