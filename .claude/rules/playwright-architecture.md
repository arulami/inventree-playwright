---
description: Playwright Page Objects, PageManager, fixtures, auth setup, and test organization patterns for the InvenTree UI suite
paths: [tests/ui-tests/**, playwright-utils/ui/**, playwright.config.ts]
---

# Playwright Architecture

## When to Use What

| Pattern | When | Location |
|---------|------|----------|
| **Page Object** | An InvenTree page or major component with multi-step user flows | `playwright-utils/ui/pages/` |
| **PageManager** | Single class that constructs every page object — exposed via the `pom` fixture | `playwright-utils/ui/fixtures/page-manager.ts` |
| **Custom Fixture** | Resources needing setup/teardown (`partCleanup`, `categoryCleanup`, API token) | `playwright-utils/ui/fixtures/index.ts` |
| **Helper Function** | Stateless utility, no cleanup needed (test data factories) | `playwright-utils/ui/helpers/` |

## Page Object Conventions

- One TypeScript class per page or major component
- File name: kebab-case (`part-detail-page.ts`, `breadcrumb-component.ts`)
- Class name: PascalCase + `Page` (or `Component`) suffix (`PartDetailPage`, `BreadcrumbComponent`)
- Constructor takes `Page` only — **no locator properties, no eager locator construction**
- **Locators inline in methods** — locators are self-descriptive and lazy; duplicating across methods is fine
- **No tiny methods** — a method covers a meaningful user task with multiple steps; never a single click or fill
- **Strict page boundaries** — a method only interacts with its own page; navigation marks the end of one method and the start of another on the next page
- **Validation at the start** — if the first step auto-waits (`click`, `fill`, locator assertion), the auto-wait is the start guard. Otherwise gate with an explicit `await expect(...)` or `waitFor(...)` before non-auto-waiting code (`textContent`, `count`, `all`, `inputValue`, `allTextContents`)
- **Validation at the end** — when the last step is an action without a trailing assertion, add a confirmation. For navigation use `expect(page).toHaveURL(...)` (page-agnostic). For in-page changes use `toBeVisible`/`toBeHidden`/`toContainText` on the affected element (e.g. the dialog closing). This is a stabilizing check, not the test's goal assertion
- **Action vs validation methods** — action methods may include lightweight stabilizing assertions; the test's **goal** assertions live in dedicated `expect*`-prefixed methods that are parametrized for reuse
- **Naming** — camelCase, descriptive verb phrases, no abbreviations or acronyms
- **Reuse first** — before adding a new method, scan the relevant class. Reuse if a method covers the flow; parametrize an existing method if it nearly does. Never write two methods that differ only in a hardcoded value

```typescript
// playwright-utils/ui/pages/part-detail-page.ts
import { type Page, expect } from '@playwright/test'

export class PartDetailPage {
  constructor(private page: Page) {}

  // Action method: a multi-step flow ending in a stabilizing check (the dialog closes)
  async editPart({ description, active }: { description?: string, active?: boolean }) {
    await this.page.getByRole('button', { name: 'action-menu-part-actions' }).click()
    await this.page.getByRole('menuitem', { name: 'action-menu-part-actions-edit' }).click()
    const editPartDialog = this.page.getByRole('dialog', { name: 'Edit Part' })
    if (description !== undefined) await editPartDialog.getByRole('textbox', { name: 'text-field-description' }).fill(description)
    if (active !== undefined) await editPartDialog.getByRole('switch', { name: 'boolean-field-active' }).setChecked(active)
    await editPartDialog.getByRole('button', { name: 'Submit' }).click()
    await expect(editPartDialog).toBeHidden()
  }

  // Validation method: owns the test's goal assertion, parametrized for reuse
  async expectDetailRows(rows: Record<string, string>) {
    await this.page.getByRole('tablist', { name: 'panel-tabs-part' }).getByRole('tab', { name: 'Part Details', exact: true }).click()
    for (const [label, value] of Object.entries(rows)) {
      await expect(this.page.getByRole('row', { name: `${label} ${value}`, exact: true })).toBeVisible()
    }
  }
}
```

Test body reads as action → action → validation:

```typescript
test('Engineer can edit a part description', async ({ pom, partCleanup }) => {
  const newPartValues = getNewPartValues('Resistors')
  await pom.homePage.openParts()
  partCleanup.register(await pom.partsPage.createPart(newPartValues))
  await pom.partDetailPage.editPart({ description: 'Edited description' })
  await pom.partDetailPage.expectDetailRows({ Description: 'Edited description' })
})
```

### Component-Level Page Objects

For widgets reused across pages (breadcrumbs, the header navigation, the details drawer), create a separate class. Components follow the same rules as pages.

```typescript
// playwright-utils/ui/pages/breadcrumb-component.ts
export class BreadcrumbComponent {
  constructor(private page: Page) {}

  async openCategory(categoryName: string) {
    await this.page.getByRole('link', { name: breadcrumbLinkName(categoryName) }).click()
    await expect(this.page).toHaveURL(/\/web\/part\/category\/\d+\//)
  }
}
```

## PageManager and the `pom` Fixture

Every page object is instantiated **eagerly** inside `PageManager` and exposed as a camelCase property. A single `pom` fixture is the only test entry point — tests never construct page objects directly.

```typescript
// playwright-utils/ui/fixtures/page-manager.ts
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
```

The fixtures module extends `test` with `pom` and the cleanup fixtures. Records created through the UI are deleted through the API at teardown, so cleanup still runs when the test fails:

```typescript
// playwright-utils/ui/fixtures/index.ts (excerpt)
export const test = base.extend<Fixtures, WorkerFixtures>({
  pom: async ({ page }, use) => {
    await use(new PageManager(page))
  },

  cleanupToken: [async ({}, use) => {
    await use(await createToken(config.username, config.password))
  }, { scope: 'worker' }],

  partCleanup: async ({ request, cleanupToken }, use) => {
    const partPks: number[] = []
    await use({ register: (partPk: number) => { partPks.push(partPk) } })
    for (const partPk of partPks) await deletePart(request, config.apiUrl, cleanupToken, partPk)
  },
})
```

Usage in tests: import `test` from the fixtures module, and register every part or category the test creates.

```typescript
import { test } from '../../../playwright-utils/ui/fixtures'

test('Engineer can create a part with only the required fields', async ({ pom, partCleanup }) => {
  const newPartValues = getNewPartValues('Resistors')
  await pom.homePage.openParts()
  partCleanup.register(await pom.partsPage.createPart(newPartValues))
  await pom.partDetailPage.expectPartDetails(newPartValues)
})
```

When adding a new page class:
1. Create `playwright-utils/ui/pages/<page-name>.ts`
2. In `PageManager`: add the import, the `readonly` property, and the constructor instantiation
3. Property name = camelCase of the class name (`StockItemPage` → `stockItemPage`)

## Auth Setup with storageState

`tests/ui-tests/auth.setup.ts` logs in once per role and saves the session, so tests never log in themselves. Two InvenTree-specific details:

- **Rate limit** — InvenTree allows 5 logins per minute per IP, so the setup reuses a saved session while `/user/me/` still accepts it.
- **Shared demo accounts** — anyone can change a demo user's profile language, so the setup pins the browser-side language to English before the app loads; locators rely on English labels.

```typescript
// tests/ui-tests/auth.setup.ts (excerpt)
const roles = [
  { role: 'engineer', username: config.username, password: config.password },
  { role: 'reader', username: config.readerUsername, password: config.readerPassword },
  { role: 'stock', username: config.stockUsername, password: config.stockPassword },
]

roles.forEach(({ role, username, password }) => {
  setup(`authenticate as ${role}`, async ({ browser, page }) => {
    const storageStateFile = `playwright-utils/ui/.auth/${role}.json`
    // ...reuse the saved session if /user/me/ still accepts it...
    await page.goto('/web/home')
    await page.getByRole('textbox', { name: 'login-username' }).fill(username)
    await page.getByRole('textbox', { name: 'login-password' }).fill(password)
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page).toHaveTitle('InvenTree Demo Server | Dashboard')
    await page.context().storageState({ path: storageStateFile })
  })
})
```

Auth setup intentionally bypasses the POM — `setup()` blocks run before any test and don't import the `pom` fixture. A new role needs its own entry in `roles`, credentials in `.env` / `api-test.config.ts`, and its own project.

### Config with Auth Projects

Each role has a project whose `testDir` is the role's spec folder and whose `storageState` is the role's saved session:

```typescript
// playwright.config.ts (excerpt)
projects: [
  { name: 'api-testing', testDir: './tests/api-tests' },
  { name: 'ui-auth-setup', testDir: './tests/ui-tests', testMatch: /auth\.setup\.ts/ },
  {
    name: 'ui-engineer',
    testDir: './tests/ui-tests/engineer',
    expect: { timeout: uiExpectTimeout },
    timeout: uiTestTimeout,
    use: { ...devices['Desktop Chrome'], storageState: 'playwright-utils/ui/.auth/engineer.json' },
    dependencies: ['ui-auth-setup'],
  },
  // ui-reader → tests/ui-tests/reader, reader.json
  // ui-stock  → tests/ui-tests/stock,  stock.json
]
```

## Directory Structure

`tests/ui-tests/` is for UI spec files and setup files only — everything executable by the test runner. All UI support code lives in `playwright-utils/ui/`. API tests and their support code (`tests/api-tests/`, `playwright-utils/api/`) follow the API rules instead.

Put a spec in the folder of the **least-privileged role** that can perform the flow. Never write tests as `admin`.

```
tests/
  ui-tests/
    auth.setup.ts              # One saved session per role (ui-auth-setup project)
    engineer/                  # engineer: can manage parts and categories
      part-creation.spec.ts
      part-management.spec.ts
      part-categories.spec.ts
    reader/                    # reader: read-only access
      part-permissions.spec.ts
    stock/                     # allaccess: cross-functional part + stock flows
      part-stock-flow.spec.ts
  api-tests/                   # API specs — see API rules

playwright-utils/
  ui/
    .auth/                     # Saved sessions (git-ignored)
    fixtures/
      index.ts                 # `pom`, `partCleanup`, `categoryCleanup` + extended `test`
      page-manager.ts          # PageManager — constructs every page object
    pages/
      home-page.ts
      parts-page.ts
      part-detail-page.ts
      category-page.ts
      stock-item-page.ts
      breadcrumb-component.ts
    helpers/
      test-data.ts             # getNewPartValues, getNewCategoryValues (faker)
  api/                         # API support code — see API rules
```

## Configuration

- `baseURL` comes from `api-test.config.ts` (`TEST_ENV` selects the demo server or a local InvenTree) — never hardcode a URL in a spec or page object.
- UI projects use a 10s assertion timeout and a 90s test timeout because the demo server loads each page through several sequential API calls. Don't override these per test.
- `trace: 'retain-on-failure'` is the default; pass `--trace on` when debugging.
- Local runs (`TEST_ENV=local`) use one worker, because parts created in parallel collide in InvenTree's part tree.

## Test Suite Hooks

When all tests in a `test.describe` block share the same setup steps, extract them into `test.beforeEach`. In this suite every UI test starts at the InvenTree dashboard.

```typescript
// GOOD: shared setup in beforeEach
test.describe('Read-only part access', () => {
  test.beforeEach(async ({ pom }) => {
    await pom.homePage.open()
  })

  test('Read-only user cannot add parts or categories', async ({ pom }) => {
    await pom.homePage.openParts()
    await pom.partsPage.expectAddActionsHidden()
  })

  test('Read-only user cannot edit or delete a part', async ({ pom }) => {
    await pom.homePage.openParts()
    const partNameValue = await pom.partsPage.openFirstListedPart()
    await pom.partDetailPage.expectPartActionsHidden(partNameValue)
  })
})
```

## Anti-Patterns

- **Locator constants on the class** (constructor or properties) — keep locators inline in methods
- **Single-action methods** (`clickSubmitButton`, `fillPartName`) — fold them into a multi-step flow
- **Methods spanning two pages** — every navigation marks a method boundary on a different page object
- **Action methods owning goal assertions** — the test's goal lives in a separate `expect*` validation method
- **Duplicate methods differing only in a hardcoded value** — parametrize the existing method instead
- **Fat page objects** with every possible method — only add what tests actually use
- **Shared mutable state** between tests — each test must be independent; create the records it needs
- **Fixed record IDs or names from the demo data** (e.g. part pk 42) — the demo server is shared and reset daily; look records up at runtime or create them
- **Skipping cleanup** — register every created part or category with `partCleanup` / `categoryCleanup`
