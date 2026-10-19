import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import { config } from '../../api-test.config'

const roles = [
  { role: 'engineer', username: config.username, password: config.password },
  { role: 'reader', username: config.readerUsername, password: config.readerPassword },
  { role: 'stock', username: config.stockUsername, password: config.stockPassword },
]

// The demo accounts are shared and their profile language can be changed by anyone; the browser-side
// language setting overrides the profile, so pin it to English before the app loads.
setup.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const sessionSettings = JSON.parse(localStorage.getItem('session-settings') ?? '{"state":{},"version":0}')
    sessionSettings.state.language = 'en'
    localStorage.setItem('session-settings', JSON.stringify(sessionSettings))
  })
})

roles.forEach(({ role, username, password }) => {
  setup(`authenticate as ${role}`, async ({ browser, page }) => {
    const storageStateFile = `playwright-utils/ui/.auth/${role}.json`
    // InvenTree rate-limits login attempts per IP (5/min), so reuse a saved session while the server still accepts it.
    // Cookies are scoped to the server's domain, so a session saved for another environment fails this check.
    if (fs.existsSync(storageStateFile)) {
      const savedContext = await browser.newContext({ storageState: storageStateFile })
      const currentUserResponse = await savedContext.request.get(`${config.apiUrl}/user/me/`)
      await savedContext.close()
      if (currentUserResponse.ok()) return
    }
    await page.goto('/web/home')
    await page.getByRole('textbox', { name: 'login-username' }).fill(username)
    await page.getByRole('textbox', { name: 'login-password' }).fill(password)
    const loginResponse = page.waitForResponse(response => response.url().includes('/api/auth/v1/auth/login') && response.status() === 200)
    await page.getByRole('button', { name: 'Log In' }).click()
    await loginResponse
    await expect(page).toHaveTitle('InvenTree Demo Server | Dashboard')
    await page.context().storageState({ path: storageStateFile })
  })
})
