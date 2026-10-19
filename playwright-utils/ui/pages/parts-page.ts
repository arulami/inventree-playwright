import { type Page, expect } from '@playwright/test'

export type NewPartValues = {
  name: string
  description: string
  categoryName: string
  ipn?: string
  revision?: string
  keywords?: string
  units?: string
  link?: string
  minimumStock?: number
  maximumStock?: number
}

export class PartsPage {
  constructor(private page: Page) {}

  // Creates a part through Add Parts → Create Part and returns the new part's pk from the detail page URL
  async createPart(partValues: NewPartValues) {
    await this.openCreatePartForm()
    await this.fillPartForm(partValues)
    await this.page.getByRole('dialog', { name: 'Add Part' }).getByRole('button', { name: 'Submit' }).click()
    await expect(this.page).toHaveURL(/\/web\/part\/\d+\/details$/)
    return Number(this.page.url().match(/\/web\/part\/(\d+)\//)![1])
  }

  // Fills every field except the name and submits; the form stays open with a field error
  async submitPartFormWithoutName(partValues: Omit<NewPartValues, 'name'>) {
    await this.openCreatePartForm()
    await this.fillPartForm({ ...partValues, name: '' })
    await this.page.getByRole('dialog', { name: 'Add Part' }).getByRole('button', { name: 'Submit' }).click()
    await expect(this.page.getByRole('dialog', { name: 'Add Part' }).getByRole('alert', { name: 'Form Error' })).toBeVisible()
  }

  async expectNameRequiredError() {
    const addPartDialog = this.page.getByRole('dialog', { name: 'Add Part' })
    await expect(addPartDialog.getByRole('alert', { name: 'Form Error' })).toContainText('Errors exist for one or more form fields')
    await expect(addPartDialog.getByRole('textbox', { name: 'text-field-name' })).toHaveAttribute('aria-invalid', 'true')
    await expect(addPartDialog.getByRole('textbox', { name: 'text-field-name' })).toHaveAccessibleDescription(/This field is required\./)
  }

  // Completes the name in the open Add Part form, resubmits, and returns the new part's pk
  async completeNameAndSubmit(name: string) {
    const addPartDialog = this.page.getByRole('dialog', { name: 'Add Part' })
    await addPartDialog.getByRole('textbox', { name: 'text-field-name' }).fill(name)
    await addPartDialog.getByRole('button', { name: 'Submit' }).click()
    await expect(this.page).toHaveURL(/\/web\/part\/\d+\/details$/)
    return Number(this.page.url().match(/\/web\/part\/(\d+)\//)![1])
  }

  // Opens the first part in the Parts list through its details drawer and returns the part's name
  async openFirstListedPart() {
    await this.page.getByRole('tablist', { name: 'panel-tabs-partcategory' }).getByRole('tab', { name: 'Parts' }).click()
    const firstPartRow = this.page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row', { name: /^Select record 1 / })
    await expect(firstPartRow).toBeVisible()
    const partNameValue = (await firstPartRow.getByRole('cell', { name: /^Thumbnail / }).textContent())!.trim()
    await firstPartRow.getByRole('cell', { name: /^Thumbnail / }).click()
    await this.page.getByRole('dialog', { name: /^details-part-\d+$/ }).getByRole('link', { name: /^details-part-\d+$/ }).click()
    await expect(this.page).toHaveURL(/\/web\/part\/\d+\/details/)
    return partNameValue
  }

  async expectAddActionsHidden() {
    await this.page.getByRole('tablist', { name: 'panel-tabs-partcategory' }).getByRole('tab', { name: 'Parts' }).click()
    await expect(this.page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row', { name: /^Select record 1 / })).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'action-menu-add-parts' })).toHaveCount(0)
    await this.page.getByRole('tablist', { name: 'panel-tabs-partcategory' }).getByRole('tab', { name: 'Part Categories' }).click()
    await expect(this.page.getByRole('tabpanel', { name: 'Part Categories' }).getByRole('row', { name: /^Select record 1 / })).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'action-button-add-part-category' })).toHaveCount(0)
  }

  private async openCreatePartForm() {
    await this.page.getByRole('tablist', { name: 'panel-tabs-partcategory' }).getByRole('tab', { name: 'Parts' }).click()
    await this.page.getByRole('button', { name: 'action-menu-add-parts' }).click()
    await this.page.getByRole('menuitem', { name: 'action-menu-add-parts-create-part' }).click()
    await expect(this.page.getByRole('dialog', { name: 'Add Part' })).toBeVisible()
  }

  private async fillPartForm(partValues: NewPartValues) {
    const addPartDialog = this.page.getByRole('dialog', { name: 'Add Part' })
    await addPartDialog.getByRole('textbox', { name: 'tree-field-category' }).fill(partValues.categoryName)
    await this.page.getByRole('listbox').getByRole('option', { name: partValues.categoryName }).click()
    await addPartDialog.getByRole('textbox', { name: 'text-field-name' }).fill(partValues.name)
    await addPartDialog.getByRole('textbox', { name: 'text-field-description' }).fill(partValues.description)
    const optionalTextFields = [
      ['text-field-IPN', partValues.ipn],
      ['text-field-revision', partValues.revision],
      ['text-field-keywords', partValues.keywords],
      ['text-field-units', partValues.units],
      ['text-field-link', partValues.link],
      ['number-field-minimum_stock', partValues.minimumStock?.toString()],
      ['number-field-maximum_stock', partValues.maximumStock?.toString()],
    ]
    for (const [fieldName, value] of optionalTextFields) {
      if (value !== undefined) await addPartDialog.getByRole('textbox', { name: fieldName }).fill(value)
    }
  }
}
