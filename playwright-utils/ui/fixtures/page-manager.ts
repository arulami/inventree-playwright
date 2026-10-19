import type { Page } from '@playwright/test'
import { HomePage } from '../pages/home-page'
import { PartsPage } from '../pages/parts-page'
import { PartDetailPage } from '../pages/part-detail-page'

export class PageManager {
  readonly homePage: HomePage
  readonly partsPage: PartsPage
  readonly partDetailPage: PartDetailPage

  constructor(page: Page) {
    this.homePage = new HomePage(page)
    this.partsPage = new PartsPage(page)
    this.partDetailPage = new PartDetailPage(page)
  }
}
