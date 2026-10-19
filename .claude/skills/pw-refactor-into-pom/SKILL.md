---
name: pw-refactor-into-pom
description: Refactor existing Playwright tests into a Page Object Model architecture with a PageManager class and a single `pom` fixture. Detects existing POM and mimics its style; bootstraps the POM infrastructure when none exists. Enforces project-specific POM conventions — locators inline in methods, no tiny methods, strict page boundaries, entry/exit validation, dedicated validation methods, and reuse-first method design.
---

Refactor existing Playwright tests to use the project's Page Object Model. Tests stay structurally identical — only their bodies change to use `pom`.

**Never skip `AskUserQuestion` steps in this skill, even if told to work autonomously.**

## Instructions

### 1. Ask which tests to refactor

Use the `AskUserQuestion` tool:

- Question: "Which tests should I refactor?"
- Header: "Refactor scope"
- Option 1: label "All tests", description "Refactor every spec file under `tests/`"
- Option 2: label "Specific test", description "I'll name the file or test title to refactor"

If the user picks "Specific test", ask for the file path or `test()` title to target. Confirm the resolved scope before proceeding.

### 2. Inventory the existing POM

Read everything under `playwright-utils/ui/` (API support code in `playwright-utils/api/` is out of scope):
- `playwright-utils/ui/pages/` — every page/component class and its public methods
- `playwright-utils/ui/fixtures/` — `PageManager`, the `pom` fixture and the `partCleanup` / `categoryCleanup` fixtures
- `playwright-utils/ui/helpers/` — utilities you may use (test data factories), but never inline into a page object

For each existing class capture:
- Class name and file
- Method signatures (so you can reuse instead of duplicating)
- Style cues (naming, parameter shape, assertion style)

If no POM exists yet, you will bootstrap it in step 5.

### 3. Analyze the tests in scope

For each spec file in scope:
- Read the spec end-to-end
- For each InvenTree page or component the test touches, check the real DOM on the live page (`npx playwright-cli snapshot` on the configured `baseUrl`, logged in as the spec's role) so you can pick reliable locators per `playwright-scripting.md` — InvenTree's aria-label names first. Never add `data-testid` attributes; we don't own the InvenTree source
- Group the test's steps by **the page they operate on** — every navigation marks a method boundary on a different page object
- For each step group decide:
  - **Reuse** — an existing method already covers it
  - **Parametrize** — an existing method nearly covers it; widen its parameters instead of duplicating
  - **Add** — the page class exists but no method covers this flow
  - **New page** — no class exists yet for that page

Write down the mapping (test step group → page method) before touching code. This avoids creating tiny one-off methods.

### 4. POM rules — design every method against these

These rules are non-negotiable. Apply them on every new or edited page object.

#### Class structure

- One TypeScript class per page or major component
- File name: kebab-case (`part-detail-page.ts`, `breadcrumb-component.ts`)
- Class name: PascalCase + `Page` (or component-appropriate) suffix (`PartDetailPage`, `BreadcrumbComponent`)
- Constructor takes `Page` only — **no locator properties, no eager locator construction**

```typescript
// GOOD
export class HomePage {
  constructor(private page: Page) {}

  async openParts() {
    await this.page.getByRole('tablist').getByRole('link', { name: 'Parts' }).click()
    await expect(this.page).toHaveURL(/\/web\/part\//)
  }
}

// BAD — locators on the class
export class PartDetailPage {
  private partActionsMenu
  constructor(private page: Page) {
    this.partActionsMenu = page.getByRole('button', { name: 'action-menu-part-actions' })
  }
}
```

#### Locators inline in methods

Always declare locators inside the method that uses them. Follow the locator priority from `playwright-scripting.md` (`getByRole` > `getByLabel` > `getByText` > `getByPlaceholder` > `getByTestId` > CSS for structural scoping). Duplicating the same locator across methods is fine — locators are lazy and self-descriptive.

#### Method size & granularity

A method represents a meaningful user task with multiple steps. Single-action methods (one click, one fill) are an anti-pattern — fold them into the surrounding flow.

```typescript
// BAD — tiny method
async clickSubmitButton() {
  await this.page.getByRole('dialog', { name: 'Edit Part' }).getByRole('button', { name: 'Submit' }).click()
}

// GOOD — meaningful flow
async editPart({ description, active }: { description?: string, active?: boolean }) {
  await this.page.getByRole('button', { name: 'action-menu-part-actions' }).click()
  await this.page.getByRole('menuitem', { name: 'action-menu-part-actions-edit' }).click()
  const editPartDialog = this.page.getByRole('dialog', { name: 'Edit Part' })
  if (description !== undefined) await editPartDialog.getByRole('textbox', { name: 'text-field-description' }).fill(description)
  if (active !== undefined) await editPartDialog.getByRole('switch', { name: 'boolean-field-active' }).setChecked(active)
  await editPartDialog.getByRole('button', { name: 'Submit' }).click()
  await expect(editPartDialog).toBeHidden()
}
```

#### Strict page boundaries

A method only interacts with its own page. When an action triggers navigation, the method ends at the navigation assertion; the **next** page's method takes over. Never combine steps from two pages in one method.

```typescript
// BAD — one method spans the stock item page and the part page
async openBasePartAndCheckStock(partName: string, quantity: number) {
  await this.page.getByRole('row', { name: `Base Part ${partName}`, exact: true }).getByRole('link', { name: partName, exact: true }).click()
  await expect(this.page.getByRole('row', { name: `In Stock ${quantity}`, exact: true })).toBeVisible()   // part page now
}

// GOOD — split across page objects, composed in the test
await pom.stockItemPage.openBasePart(newPartValues.name)
await pom.partDetailPage.expectDetailRows({ 'In Stock': `${stockValues.quantity}` })
```

#### Validation at the start

If the method's first Playwright call is auto-waiting (`click`, `fill`, `check`, locator assertion, etc.), the auto-wait is the start guard — no extra code needed. Otherwise add an explicit `await expect(...)` or `waitFor(...)` before any non-auto-waiting code (`textContent`, `count`, `all`, `inputValue`, `allTextContents`).

```typescript
// GOOD — first step auto-waits
async createCategory({ name, description }: { name: string, description: string }) {
  await this.page.getByRole('button', { name: 'action-button-add-part-category' }).click()
  // ...
}

// GOOD — non-auto-waiting read gated by an assertion (table rows load from the API)
async openFirstListedPart() {
  const firstPartRow = this.page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row', { name: /^Select record 1 / })
  await expect(firstPartRow).toBeVisible()
  const partNameValue = (await firstPartRow.getByRole('cell', { name: /^Thumbnail / }).textContent())!.trim()
  // ...
}
```

#### Validation at the end

When the last step is an action with no trailing assertion, add a confirmation:

- For navigation: `await expect(this.page).toHaveURL(...)` — page-agnostic, a clean boundary marker
- For in-page changes: a simple `toBeVisible` / `toBeHidden` / `toContainText` on the affected element

This is a **stabilizing** check, not the test's goal assertion — keep it minimal.

```typescript
// GOOD — URL assertion after navigation (deleting a part shows its category)
async deletePart() {
  // ... open Part Actions → Delete and confirm
  await expect(this.page).toHaveURL(/\/web\/part\/category\/\d+\/parts$/)
}

// GOOD — in-page confirmation (the dialog closes after saving)
async addParameter({ templateName, templateOption, data }: { templateName: string, templateOption: string, data: string }) {
  // ... open Parameters → Add Parameters → Create Parameter and fill the form
  await addParameterDialog.getByRole('button', { name: 'Submit' }).click()
  await expect(addParameterDialog).toBeHidden()
}
```

#### Action methods vs validation methods

- **Action methods** perform user interactions. They may include lightweight stabilizing assertions (start/end guards above, or e.g., `toBeVisible` to confirm a dialog opened before interacting with it).
- **Validation methods** are dedicated to the test's *goal* assertions and do nothing else. Names start with `expect`. Parametrize them so multiple tests reuse the same method.

```typescript
// Validation method — owns the goal assertion, parametrized
async expectDeleteRefused(message: string) {
  await expect(this.page.getByRole('dialog', { name: 'Delete Part' }).getByRole('alert', { name: 'Form Error' })).toContainText(message)
  await expect(this.page).toHaveURL(/\/web\/part\/\d+\/details$/)
}
```

The test reads as action → action → validation:

```typescript
test('Engineer cannot delete a locked part', async ({ pom, partCleanup }) => {
  await pom.homePage.openParts()
  partCleanup.register(await pom.partsPage.createPart(getNewPartValues('Resistors')))
  await pom.partDetailPage.editPart({ locked: true, active: false })
  await pom.partDetailPage.attemptDeletePart()
  await pom.partDetailPage.expectDeleteRefused('Cannot delete this part as it is locked')
})
```

#### Method naming

- camelCase
- Descriptive verb phrases — no abbreviations, no acronyms
- Validation methods start with `expect`

```
createPart                 ✅
openFirstListedPart        ✅
addStockItem               ✅
expectDeleteRefused        ✅

edit                       ❌ vague
clickAddBtn                ❌ abbreviation
doPart                     ❌ vague verb
```

#### Reuse first

Before adding a new method, scan every existing method on the relevant class. If any covers the flow — use it. If a near-match exists, **parametrize** the existing method (add an argument) rather than duplicating it. Never write two methods that differ only in a hardcoded value.

### 5. Build / extend PageManager and the `pom` fixture

`PageManager` instantiates every page object **eagerly** in its constructor and exposes them as camelCase properties. A single `pom` fixture is the only test entry point.

If these files don't exist yet, create them:

```typescript
// playwright-utils/ui/fixtures/page-manager.ts
import type { Page } from '@playwright/test'
import { HomePage } from '../pages/home-page'
import { PartsPage } from '../pages/parts-page'

export class PageManager {
  readonly homePage: HomePage
  readonly partsPage: PartsPage

  constructor(page: Page) {
    this.homePage = new HomePage(page)
    this.partsPage = new PartsPage(page)
  }
}
```

```typescript
// playwright-utils/ui/fixtures/index.ts (keep the existing partCleanup / categoryCleanup fixtures)
import { test as base, expect } from '@playwright/test'
import { PageManager } from './page-manager'

type Fixtures = { pom: PageManager }

export const test = base.extend<Fixtures>({
  pom: async ({ page }, use) => {
    await use(new PageManager(page))
  },
})

export { expect }
```

When you add a new page class:
1. Create `playwright-utils/ui/pages/<page-name>.ts`
2. In `PageManager`: add the import, the `readonly` property, and the constructor instantiation
3. Property name = camelCase of the class name (`StockItemPage` → `stockItemPage`)

### 6. Refactor the test files

Swap inline Playwright calls for `pom` calls. **Do not split tests, do not regroup describes, do not move steps between tests, do not change `beforeEach` structure.** Test structure stays identical — only the body changes.

```typescript
// Before
import { test, expect } from '@playwright/test'

test('Read-only user cannot add parts or categories', async ({ page }) => {
  await page.goto('/web/home')
  await page.getByRole('tablist').getByRole('link', { name: 'Parts' }).click()
  await page.getByRole('tablist', { name: 'panel-tabs-partcategory' }).getByRole('tab', { name: 'Parts' }).click()
  await expect(page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row', { name: /^Select record 1 / })).toBeVisible()
  await expect(page.getByRole('button', { name: 'action-menu-add-parts' })).toHaveCount(0)
})

// After
import { test } from '../../../playwright-utils/ui/fixtures'

test('Read-only user cannot add parts or categories', async ({ pom }) => {
  await pom.homePage.open()
  await pom.homePage.openParts()
  await pom.partsPage.expectAddActionsHidden()
})
```

If a test still needs the raw `page` (e.g., to capture text content with code not yet wrapped in a method), include both fixtures: `async ({ pom, page }) => { ... }`. Prefer adding a method to the page class over leaving raw `page` calls in the spec.

### 7. Run the affected tests

```bash
npx playwright test <file-or-pattern> --trace on --retries 0
```

If passing → step 9. If failing → step 8.

### 8. Debug using trace

Follow the same trace-driven debug loop as `pw-new-test`:

#### 8.1 Read terminal output

Extract the error message, stack trace, failing line, and trace zip path (under `test-results/`). If the path isn't visible:

```bash
find test-results -name "trace.zip" -newer /tmp/test-start-marker 2>/dev/null | head -5
```

#### 8.2 Inspect the trace via CLI (not GUI)

```bash
npx playwright trace open <path-to-trace.zip>
npx playwright trace actions
npx playwright trace action <number>
npx playwright trace snapshot <action-number> --name after
npx playwright trace requests
npx playwright trace errors
npx playwright trace close
```

#### 8.3 Apply the fix

Common refactor failures and the right fix:
- **Locator mismatch** — the source uses different text/role than the original test; fix the locator inside the page method
- **Boundary error** — a method does work that belongs on the next page; split it into two methods on the correct classes
- **Missing start guard** — the method starts with `textContent()`/`all()`/`count()` without an explicit wait; add an `expect` first
- **Missing end confirmation** — an action method's last step navigates but the method doesn't assert the new URL; add `expect(this.page).toHaveURL(...)`

If the failure is in the application (not the test), explain it to the user instead of guessing at a fix.

Repeat 7–8 until passing.

### 9. Confirm and finalize

Use `AskUserQuestion`:

- Question: "Refactor passes. Does it look right?"
- Header: "Finalize"
- Option 1: label "Looks good", description "Remove leftover comments and finalize"
- Option 2: label "Needs changes", description "Tell me what to adjust"

On **"Looks good"**: remove inline `//` comments from the refactored spec files (keep `test.describe` labels, titles, and code). Collapse blank lines between consecutive code lines inside `test()` bodies; preserve a single blank line between top-level blocks (between `describe` and `test`, between sibling `test` blocks). Then go to step 10.

On **"Needs changes"**: apply the user's feedback, re-run the test (step 7), and loop.

### 10. Offer to commit

Use `AskUserQuestion`:

- Question: "Commit the refactor?"
- Header: "Commit"
- Option 1: label "Yes, commit", description "Stage POM + spec changes and create a commit"
- Option 2: label "No", description "Skip the commit"

On **"Yes, commit"**: run `git status` and `git diff` to review, draft a concise message (e.g., `refactor(tests): convert guest tests to PageManager POM`), stage the new/changed files in `playwright-utils/` and `tests/`, and commit. Match the repo's existing commit message style from `git log`.

On **"No"**: stop.

## Anti-patterns (quick reference)

- ❌ Locator constants on the class (constructor or properties)
- ❌ Single-action methods (`clickSubmitButton`, `fillPartName`)
- ❌ Methods spanning two pages
- ❌ Action methods owning the test's goal assertion (use a separate `expect*` validation method)
- ❌ Duplicate methods that differ only in a hardcoded value (parametrize instead)
- ❌ Renaming the same locator across methods just because the context changed
- ❌ Splitting `test()` blocks or moving steps during refactor — structure stays untouched
- ❌ Custom timeouts added preemptively (default timeouts only — see `playwright-scripting.md`)
