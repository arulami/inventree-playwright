import { type Page, expect } from '@playwright/test'

// InvenTree names breadcrumb links "breadcrumb-<level>-<slug>", where the slug is the lowercased, hyphenated name
const breadcrumbLinkName = (name: string) => new RegExp(`^breadcrumb-\\d+-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}$`)

export class BreadcrumbComponent {
  constructor(private page: Page) {}

  async openCategory(categoryName: string) {
    await this.page.getByRole('link', { name: breadcrumbLinkName(categoryName) }).click()
    await expect(this.page).toHaveURL(/\/web\/part\/category\/\d+\//)
  }

  // The level numbers in breadcrumb names shift while the path loads, so only presence is checked;
  // the hierarchy itself is asserted through the parent's Subcategories table
  async expectCategoryPath(categoryNames: string[]) {
    for (const categoryName of categoryNames) {
      await expect(this.page.getByRole('link', { name: breadcrumbLinkName(categoryName) })).toBeVisible()
    }
  }
}
