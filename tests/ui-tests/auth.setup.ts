import { test as setup, expect } from '@playwright/test'
import { config } from '../../api-test.config'

const engineerFile = 'playwright-utils/ui/.auth/engineer.json'
const readerFile = 'playwright-utils/ui/.auth/reader.json'

// The demo accounts are shared and their profile language can be changed by anyone; the browser-side
// language setting overrides the profile, so pin it to English before the app loads.
setup.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const sessionSettings = JSON.parse(localStorage.getItem('session-settings') ?? '{"state":{},"version":0}')
    sessionSettings.state.language = 'en'
    localStorage.setItem('session-settings', JSON.stringify(sessionSettings))
  })
})

setup('authenticate as engineer', async ({ page }) => {
  await page.goto('/web/home')
  await page.getByRole('textbox', { name: 'login-username' }).fill(config.username)
  await page.getByRole('textbox', { name: 'login-password' }).fill(config.password)
  const loginResponse = page.waitForResponse(response => response.url().includes('/api/auth/v1/auth/login') && response.status() === 200)
  await page.getByRole('button', { name: 'Log In' }).click()
  await loginResponse
  await expect(page).toHaveTitle('InvenTree Demo Server | Dashboard')
  await page.context().storageState({ path: engineerFile })
})

setup('authenticate as reader', async ({ page }) => {
  await page.goto('/web/home')
  await page.getByRole('textbox', { name: 'login-username' }).fill(config.readerUsername)
  await page.getByRole('textbox', { name: 'login-password' }).fill(config.readerPassword)
  const loginResponse = page.waitForResponse(response => response.url().includes('/api/auth/v1/auth/login') && response.status() === 200)
  await page.getByRole('button', { name: 'Log In' }).click()
  await loginResponse
  await expect(page).toHaveTitle('InvenTree Demo Server | Dashboard')
  await page.context().storageState({ path: readerFile })
})
