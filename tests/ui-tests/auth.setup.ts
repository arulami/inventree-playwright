import { test as setup, expect } from '@playwright/test'
import { config } from '../../api-test.config'

const engineerFile = 'playwright-utils/ui/.auth/engineer.json'

setup('authenticate as engineer', async ({ page }) => {
  await page.goto('/web/home')
  await page.getByRole('textbox', { name: 'login-username' }).fill(config.username)
  await page.getByRole('textbox', { name: 'login-password' }).fill(config.password)
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveTitle('InvenTree Demo Server | Dashboard')
  await page.context().storageState({ path: engineerFile })
})
