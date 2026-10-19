import { type Page, expect } from '@playwright/test'

export type NewPartValues = {
  name: string
  description: string
  categoryName: string
}

export class PartsPage {
  constructor(private page: Page) {}

  // Creates a part through Add Parts → Create Part and returns the new part's pk from the detail page URL
  async createPart({ name, description, categoryName }: NewPartValues) {
    await this.page.getByRole('tablist', { name: 'panel-tabs-partcategory' }).getByRole('link', { name: 'Parts' }).click()
    await this.page.getByRole('button', { name: 'action-menu-add-parts' }).click()
    await this.page.getByRole('menuitem', { name: 'action-menu-add-parts-create-part' }).click()
    const addPartDialog = this.page.getByRole('dialog', { name: 'Add Part' })
    await addPartDialog.getByRole('textbox', { name: 'tree-field-category' }).fill(categoryName)
    await this.page.getByRole('listbox').getByRole('option', { name: categoryName }).click()
    await addPartDialog.getByRole('textbox', { name: 'text-field-name' }).fill(name)
    await addPartDialog.getByRole('textbox', { name: 'text-field-description' }).fill(description)
    await addPartDialog.getByRole('button', { name: 'Submit' }).click()
    await expect(this.page).toHaveURL(/\/web\/part\/\d+\/details$/)
    return Number(this.page.url().match(/\/web\/part\/(\d+)\//)![1])
  }
}
