import { test as base, expect } from '@playwright/test'
import { PageManager } from './page-manager'
import { config } from '../../../api-test.cofig'
import { createToken } from '../../../helpers/createToken'
import { deletePart } from '../../../helpers/deletePart'

type Fixtures = {
  pom: PageManager
  partCleanup: { register: (partPk: number) => void }
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
})

export { expect }
