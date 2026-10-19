import { test as base, expect } from '@playwright/test'
import { PageManager } from './page-manager'
import { config } from '../../../api-test.config'
import { createToken } from '../../../helpers/createToken'
import { deletePart } from '../../../helpers/deletePart'
import { deleteCategory } from '../../../helpers/deleteCategory'

type Fixtures = {
  pom: PageManager
  partCleanup: { register: (partPk: number) => void }
  categoryCleanup: { register: (categoryPk: number) => void }
}

type WorkerFixtures = {
  cleanupToken: string
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  pom: async ({ page }, use) => {
    await use(new PageManager(page))
  },

  cleanupToken: [async ({}, use) => {
    await use(await createToken(config.username, config.password))
  }, { scope: 'worker' }],

  // Deletes parts created through the UI via the API after the test, even when it fails
  partCleanup: async ({ request, cleanupToken }, use) => {
    const partPks: number[] = []
    await use({ register: (partPk: number) => { partPks.push(partPk) } })
    for (const partPk of partPks) await deletePart(request, config.apiUrl, cleanupToken, partPk)
  },

  // Deletes categories created through the UI via the API after the test, newest first so sub-categories go before their parents
  categoryCleanup: async ({ request, cleanupToken }, use) => {
    const categoryPks: number[] = []
    await use({ register: (categoryPk: number) => { categoryPks.push(categoryPk) } })
    for (const categoryPk of categoryPks.reverse()) await deleteCategory(request, config.apiUrl, cleanupToken, categoryPk)
  },
})

export { expect }
