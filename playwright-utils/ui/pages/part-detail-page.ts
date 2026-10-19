import { type Page, expect } from '@playwright/test'

export type PartChanges = {
  description?: string
  locked?: boolean
  active?: boolean
}

export class PartDetailPage {
  constructor(private page: Page) {}

  async expectPartDetails({ name, description, categoryName }: { name: string, description: string, categoryName: string }) {
    // The page title shortens long names, so the name is checked in the details panel instead
    await expect(this.page).toHaveTitle(/^InvenTree Demo Server \| Part: /)
    await this.expectDetailRows({ Name: name, Description: description, Category: categoryName })
  }

  // Each entry is a row label and the value shown next to it, e.g. { IPN: 'PW-0001', 'Minimum Stock': '5 [m]' }
  async expectDetailRows(rows: Record<string, string>) {
    await this.page.getByRole('tablist', { name: 'panel-tabs-part' }).getByRole('tab', { name: 'Part Details', exact: true }).click()
    for (const [label, value] of Object.entries(rows)) {
      await expect(this.page.getByRole('row', { name: `${label} ${value}`, exact: true })).toBeVisible()
    }
  }

  // Edits the part through Part Actions → Edit and waits for the dialog to close after saving
  async editPart({ description, locked, active }: PartChanges) {
    await this.page.getByRole('button', { name: 'action-menu-part-actions' }).click()
    await this.page.getByRole('menuitem', { name: 'action-menu-part-actions-edit' }).click()
    const editPartDialog = this.page.getByRole('dialog', { name: 'Edit Part' })
    if (description !== undefined) await editPartDialog.getByRole('textbox', { name: 'text-field-description' }).fill(description)
    if (locked !== undefined) await editPartDialog.getByRole('switch', { name: 'boolean-field-locked' }).setChecked(locked)
    if (active !== undefined) await editPartDialog.getByRole('switch', { name: 'boolean-field-active' }).setChecked(active)
    await editPartDialog.getByRole('button', { name: 'Submit' }).click()
    await expect(editPartDialog).toBeHidden()
  }

  async expectDeleteUnavailable() {
    await this.page.getByRole('button', { name: 'action-menu-part-actions' }).click()
    await expect(this.page.getByRole('menuitem', { name: 'action-menu-part-actions-delete' })).toBeDisabled()
    await this.page.keyboard.press('Escape')
    await expect(this.page.getByRole('menuitem', { name: 'action-menu-part-actions-delete' })).toBeHidden()
  }

  // Deletes the part; InvenTree then shows the part's category
  async deletePart() {
    await this.confirmDeletePart()
    await expect(this.page).toHaveURL(/\/web\/part\/category\/\d+\/parts$/)
  }

  // Confirms deletion of a part the server refuses to delete; the dialog stays open with the error
  async attemptDeletePart() {
    await this.confirmDeletePart()
    await expect(this.page.getByRole('dialog', { name: 'Delete Part' }).getByRole('alert', { name: 'Form Error' })).toBeVisible()
  }

  async expectDeleteRefused(message: string) {
    await expect(this.page.getByRole('dialog', { name: 'Delete Part' }).getByRole('alert', { name: 'Form Error' })).toContainText(message)
    await expect(this.page).toHaveURL(/\/web\/part\/\d+\/details$/)
  }

  async expectPartActionsHidden(name: string) {
    await expect(this.page).toHaveTitle(/^InvenTree Demo Server \| Part: /)
    await expect(this.page.getByRole('row', { name: `Name ${name}`, exact: true })).toBeVisible()
    await expect(this.page.getByRole('button', { name: 'action-menu-part-actions' })).toHaveCount(0)
  }

  // Adds a parameter from Parameters → Add Parameters → Create Parameter
  async addParameter({ templateName, templateOption, data }: { templateName: string, templateOption: string, data: string }) {
    await this.page.getByRole('tablist', { name: 'panel-tabs-part' }).getByRole('tab', { name: 'Parameters', exact: true }).click()
    await this.page.getByRole('button', { name: 'action-menu-add-parameters' }).click()
    await this.page.getByRole('menuitem', { name: 'action-menu-add-parameters-create-parameter' }).click()
    const addParameterDialog = this.page.getByRole('dialog', { name: 'Add Parameter' })
    await addParameterDialog.getByRole('combobox', { name: 'related-field-template' }).fill(templateName)
    await this.page.getByRole('option', { name: templateOption, exact: true }).click()
    await addParameterDialog.getByRole('textbox', { name: 'text-field-data' }).fill(data)
    await addParameterDialog.getByRole('button', { name: 'Submit' }).click()
    await expect(addParameterDialog).toBeHidden()
  }

  async expectParameter({ templateName, value }: { templateName: string, value: string }) {
    const parameterRow = this.page.getByRole('tabpanel', { name: 'Parameters' }).getByRole('row').filter({ has: this.page.getByRole('cell', { name: templateName, exact: true }) })
    await expect(parameterRow).toContainText(value)
  }

  // Adds a stock item from Stock → Add Stock Item; InvenTree then shows the new stock item's page
  async addStockItem({ quantity, locationName }: { quantity: number, locationName: string }) {
    await this.page.getByRole('tablist', { name: 'panel-tabs-part' }).getByRole('tab', { name: 'Stock', exact: true }).click()
    await this.page.getByRole('button', { name: 'action-button-add-stock-item' }).click()
    const addStockItemDialog = this.page.getByRole('dialog', { name: 'Add Stock Item' })
    await addStockItemDialog.getByRole('textbox', { name: 'tree-field-location' }).fill(locationName)
    // Option names start with the tree toggle and continue with the description, so anchor on the location name
    await this.page.getByRole('option', { name: new RegExp(`^(Expand |Collapse )?${locationName}(\\s|$)`) }).click()
    await addStockItemDialog.getByRole('textbox', { name: 'number-field-quantity' }).fill(quantity.toString())
    await addStockItemDialog.getByRole('button', { name: 'Submit' }).click()
    await expect(this.page).toHaveURL(/\/web\/stock\/item\/\d+\/details$/)
  }

  private async confirmDeletePart() {
    await this.page.getByRole('button', { name: 'action-menu-part-actions' }).click()
    await this.page.getByRole('menuitem', { name: 'action-menu-part-actions-delete' }).click()
    await this.page.getByRole('dialog', { name: 'Delete Part' }).getByRole('button', { name: 'Delete' }).click()
  }
}
