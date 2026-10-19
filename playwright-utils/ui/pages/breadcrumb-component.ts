import { type Page, expect } from '@playwright/test'

// InvenTree names breadcrumb links "breadcrumb-<level>-<slug>", where the slug is the lowercased, hyphenated name
const breadcrumbLinkName = (name: string) => new RegExp(`^breadcrumb-\\d+-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}$`)

export class BreadcrumbComponent {
  constructor(private page: Page) {}

  async openCategory(categoryName: string) {
    await this.page.getByRole('link', { name: breadcrumbLinkName(categoryName) }).click()
    await expect(this.page).toHaveURL(/\/web\/part\/category\/\d+\//)
  }

  async expectCategoryPath(categoryNames: string[]) {
    for (const [level, categoryName] of categoryNames.entries()) {
      await expect(this.page.getByRole('link', { name: breadcrumbLinkName(categoryName) })).toHaveAccessibleName(new RegExp(`^breadcrumb-${level + 1}-`))
    }
  }
}
