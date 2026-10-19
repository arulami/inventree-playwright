import { type Page, expect } from '@playwright/test'

export class CategoryPage {
  constructor(private page: Page) {}

  // Creates a category from the Part Categories / Subcategories panel and returns its pk.
  // On a category page the new category's parent is the current category.
  async createCategory({ name, description }: { name: string, description: string }) {
    await this.page.getByRole('tablist', { name: 'panel-tabs-partcategory' }).getByRole('tab', { name: /^(Part Categories|Subcategories)$/ }).click()
    await this.page.getByRole('button', { name: 'action-button-add-part-category' }).click()
    const newCategoryDialog = this.page.getByRole('dialog', { name: 'New Part Category' })
    await newCategoryDialog.getByRole('textbox', { name: 'text-field-name' }).fill(name)
    await newCategoryDialog.getByRole('textbox', { name: 'text-field-description' }).fill(description)
    await newCategoryDialog.getByRole('button', { name: 'Submit' }).click()
    await expect(newCategoryDialog).toBeHidden()
    await expect(this.page).toHaveURL(/\/web\/part\/category\/\d+\/subcategories$/)
    return Number(this.page.url().match(/\/web\/part\/category\/(\d+)\//)![1])
  }

  async expectSubcategory({ name, path }: { name: string, path: string }) {
    await this.page.getByRole('tablist', { name: 'panel-tabs-partcategory' }).getByRole('tab', { name: 'Subcategories' }).click()
    const subcategoryRow = this.page.getByRole('tabpanel', { name: 'Subcategories' }).getByRole('row').filter({ has: this.page.getByRole('cell', { name, exact: true }) })
    await expect(subcategoryRow).toContainText(path)
  }

  // Searches the category's Parts panel and waits for the filtered results
  async searchParts(searchTerm: string) {
    await this.page.getByRole('tablist', { name: 'panel-tabs-partcategory' }).getByRole('tab', { name: 'Parts' }).click()
    const searchResponse = this.page.waitForResponse(response => {
      const url = new URL(response.url())
      return url.pathname === '/api/part/' && url.searchParams.get('search') === searchTerm && response.ok()
    })
    await this.page.getByRole('tabpanel', { name: 'Parts' }).getByRole('textbox', { name: 'table-search-input' }).fill(searchTerm)
    await searchResponse
  }

  async expectPartListed({ name, categoryName, stock }: { name: string, categoryName: string, stock: string }) {
    const partRow = this.page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row').filter({ has: this.page.getByRole('cell', { name: `Thumbnail ${name}`, exact: true }) })
    await expect(partRow.getByRole('cell', { name: categoryName, exact: true })).toBeVisible()
    await expect(partRow.getByRole('cell', { name: stock, exact: true })).toBeVisible()
  }

  async expectNoPartsListed() {
    await expect(this.page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row', { name: /^Select record \d+ / })).toHaveCount(0)
  }
}
