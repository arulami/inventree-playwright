import type { Page } from '@playwright/test'
import { HomePage } from '../pages/home-page'
import { PartsPage } from '../pages/parts-page'
import { PartDetailPage } from '../pages/part-detail-page'
import { CategoryPage } from '../pages/category-page'
import { BreadcrumbComponent } from '../pages/breadcrumb-component'

export class PageManager {
  readonly homePage: HomePage
  readonly partsPage: PartsPage
  readonly partDetailPage: PartDetailPage
  readonly categoryPage: CategoryPage
  readonly breadcrumbComponent: BreadcrumbComponent

  constructor(page: Page) {
    this.homePage = new HomePage(page)
    this.partsPage = new PartsPage(page)
    this.partDetailPage = new PartDetailPage(page)
    this.categoryPage = new CategoryPage(page)
    this.breadcrumbComponent = new BreadcrumbComponent(page)
  }
}
