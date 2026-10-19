---
description: Playwright E2E test authoring conventions for the InvenTree UI - locators, assertions, waiting, test structure, naming, code style, actions, and form interactions
paths: [tests/ui-tests/**, playwright-utils/ui/**]
---

# Playwright Scripting Rules

The suite tests InvenTree's web UI (`/web/...`, built with Mantine) as deployed on the demo server or a local Docker instance. **We do not own the application source**: never plan to add `data-testid` attributes or change InvenTree code. Build locators from what the running UI exposes.

## Locators

### Locator Priority (Highest to Lowest)

1. **`getByRole`** with an accessible name — buttons, links, tabs, menu items, dialogs, rows, textboxes, switches (primary approach). Most InvenTree controls carry a stable `aria-label` (see [InvenTree Accessible Names](#inventree-accessible-names)), so `getByRole` almost always works
2. **`getByLabel`** — form inputs with an associated label when no role/name pair is available
3. **`getByText`** — static text content
4. **`getByPlaceholder`** — when label is absent
5. **`getByTestId`** — only if InvenTree already renders a `data-testid` for the element. Never assume one exists and never propose adding one
6. **CSS selector** (`page.locator(...)`) — lowest priority. Acceptable **only** for stable HTML tags used as structural scoping. **Never use CSS class names** — Mantine generates class names (`.mantine-Button-root`, `.m_77c9d27d`) that change between versions

```typescript
// GOOD: role + InvenTree aria-label (stable across releases and UI languages)
page.getByRole('button', { name: 'action-menu-part-actions' })
page.getByRole('menuitem', { name: 'action-menu-part-actions-edit' })
page.getByRole('tablist', { name: 'panel-tabs-part' }).getByRole('tab', { name: 'Parameters', exact: true })

// GOOD: role + visible text when there is no aria-label
page.getByRole('dialog', { name: 'Add Part' }).getByRole('button', { name: 'Submit' })

// BAD: generated Mantine classes and structural paths
page.locator('.mantine-Button-root')
page.locator('div > form > input:first-child')
```

### ARIA Roles Used in InvenTree

Only use roles that actually exist on the page. These are the ones the suite relies on:

| Role | Where it appears in InvenTree |
|------|-------------------------------|
| `button` | Action menus (`action-menu-*`), action buttons (`action-button-*`), dialog Submit / Delete |
| `menuitem` | Items in an opened action menu (`action-menu-<menu>-<item>`) |
| `link` | Header navigation, breadcrumbs (`breadcrumb-<level>-<slug>`), links inside detail rows |
| `tablist` / `tab` / `tabpanel` | Panel tabs on detail pages (`panel-tabs-part`, `panel-tabs-partcategory`); tab panels are named after the tab (`'Parts'`, `'Parameters'`) |
| `dialog` | Forms (`'Add Part'`, `'Edit Part'`, `'Delete Part'`) and details drawers (`details-part-<pk>`) |
| `textbox` | Form fields (`text-field-*`, `number-field-*`, `tree-field-*`), login fields, table search |
| `combobox` / `listbox` / `option` | Related-object pickers (`related-field-*`) and tree pickers with their option lists |
| `switch` | Boolean form fields (`boolean-field-*`) |
| `row` / `cell` | Data tables and the label/value rows on detail panels (`'Name <value>'`, `'Quantity 25'`) |
| `alert` | Form errors (`{ name: 'Form Error' }`) |

### InvenTree Accessible Names

InvenTree gives its controls predictable `aria-label`s. Use them instead of visible text where they exist — they don't depend on the UI language.

| Pattern | Example |
|---------|---------|
| `action-menu-<menu>` / `action-menu-<menu>-<item>` | `action-menu-add-parts`, `action-menu-add-parts-create-part` |
| `action-button-<action>` | `action-button-add-part-category`, `action-button-add-stock-item` |
| `text-field-<field>`, `number-field-<field>` | `text-field-name`, `text-field-IPN`, `number-field-quantity` |
| `boolean-field-<field>` (switch) | `boolean-field-active`, `boolean-field-locked` |
| `tree-field-<field>`, `related-field-<field>` | `tree-field-category`, `related-field-template` |
| `panel-tabs-<model>` | `panel-tabs-part`, `panel-tabs-partcategory` |
| `breadcrumb-<level>-<slug>` | `breadcrumb-1-passives` — the level shifts while the path loads, so match it with a regex |
| `details-<model>-<pk>` | `details-part-1234` on the details drawer and its link |
| `table-search-input` | The search box above a data table |
| Table rows | `Select record <n> …` — match with a regex such as `/^Select record 1 /` |

### Accessible Names Must Match the Live Page Exactly

Never assume or paraphrase a name. Read it from the running InvenTree UI: a `npx playwright-cli snapshot` of the page, `generate-locator`, or the DOM snapshot in a trace. InvenTree's open-source frontend (`src/frontend` in `github.com/inventree/InvenTree`, matching the server version) is a useful reference for how names are built, but the live page is the source of truth.

Visible labels are English because the auth setup pins the UI language. Prefer aria-label names anyway; use visible text only where no aria-label exists (dialog titles, tab names, row labels).

### Locator Uniqueness

Locators used with action methods (`click()`, `fill()`, `check()`, `setChecked()`) **must resolve to exactly one element**. If several elements match, narrow the scope by chaining from a parent — most often the open dialog or the active tab panel.

When a locator intentionally returns multiple elements (e.g. table rows), uniqueness is not required — use `all()`, `count()`, or `nth()` as needed.

```typescript
// BAD: every open form has a Submit button
page.getByRole('button', { name: 'Submit' })

// GOOD: scoped to the dialog being submitted
page.getByRole('dialog', { name: 'Add Part' }).getByRole('button', { name: 'Submit' })

// GOOD: intentionally working with a collection
await expect(page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row', { name: /^Select record \d+ / })).toHaveCount(0)
```

### Scoping to Containers (Avoiding False Positives)

InvenTree pages repeat the same patterns many times: several tables, several tabs, identical Submit buttons, the same part name in a table and a drawer. **Always scope interactions and assertions to the specific container** — never rely on `.first()` or unscoped locators that could match an element elsewhere on the page.

A false positive occurs when the intended element is missing but the locator silently matches a different element, making the test pass incorrectly.

```typescript
// BAD: the first "Thumbnail" cell anywhere — may belong to another table
page.getByRole('cell', { name: /^Thumbnail / }).first().click()

// GOOD: scoped to the Parts tab panel and the first record row
const firstPartRow = page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row', { name: /^Select record 1 / })
await firstPartRow.getByRole('cell', { name: /^Thumbnail / }).click()

// BAD: the error text could come from any alert on the page
await expect(page.getByRole('alert')).toContainText('Cannot delete this part as it is locked')

// GOOD: scoped to the Delete Part dialog's form error
await expect(page.getByRole('dialog', { name: 'Delete Part' }).getByRole('alert', { name: 'Form Error' })).toContainText('Cannot delete this part as it is locked')
```

**Rule of thumb:** if a locator uses `.first()`, `.nth()`, or matches a generic label like "Submit", "Delete" or "Edit", it likely needs a parent scope.

### Semantic Scoping (Asserting Relationships)

Scoping also validates that a value appears in the **correct logical context**. Even when a value is unique on the page, scope it to its parent row or panel if the test is verifying a relationship.

**Key question:** "If this value moved to a different row or section, would that be a bug?" If yes — the assertion must pin it to the right place.

```typescript
// A parameter value must belong to the right parameter template

// BAD: "6.3" anywhere on the page is accepted
await expect(page.getByText('6.3')).toBeVisible()

// GOOD: scoped to the parameter's row
const parameterRow = page.getByRole('tabpanel', { name: 'Parameters' }).getByRole('row').filter({ has: page.getByRole('cell', { name: 'Length', exact: true }) })
await expect(parameterRow).toContainText('6.3')

// A stock count must belong to the new part's row in the category table

// BAD: the count could be any part's stock
await expect(page.getByRole('cell', { name: '25', exact: true })).toBeVisible()

// GOOD: scoped to the part's row
const partRow = page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row').filter({ has: page.getByRole('cell', { name: `Thumbnail ${partName}`, exact: true }) })
await expect(partRow.getByRole('cell', { name: '25', exact: true })).toBeVisible()
```

Detail panels render each field as a row named `'<Label> <value>'`, so `getByRole('row', { name: 'Description My text', exact: true })` asserts the label and value together.

### Cross-Page Content Linking

When a user action navigates to another page that shows related content (e.g. clicking a part in a table opens that part), **capture a value from the source page and assert it on the destination**. This proves the user landed on the *right* record, not just any page of the same type.

```typescript
// BAD: confirms a part page opened, but not which part
await expect(page).toHaveURL(/\/web\/part\/\d+\/details/)

// GOOD: capture the name from the list, assert it on the detail page
const partNameValue = (await firstPartRow.getByRole('cell', { name: /^Thumbnail / }).textContent())!.trim()
// ...open the part through its details drawer...
await expect(page.getByRole('row', { name: `Name ${partNameValue}`, exact: true })).toBeVisible()
```

This applies whenever navigation creates a logical link: table row → detail page, stock item → base part, breadcrumb → parent category.

### Chaining and Filtering

Prefer the built-in `name` or `hasText` argument on the locator constructor. Use `.filter()` only for a **second level** of filtering on an already-constructed locator.

```typescript
// GOOD: name argument for role-based filtering (preferred)
page.getByRole('tab', { name: 'Part Details', exact: true })
page.getByRole('dialog', { name: 'Edit Part' })

// GOOD: chain to narrow scope
page.getByRole('tablist', { name: 'panel-tabs-partcategory' }).getByRole('tab', { name: 'Parts' })

// GOOD: .filter() for second-level filtration on an existing locator
page.getByRole('tabpanel', { name: 'Subcategories' }).getByRole('row').filter({ has: page.getByRole('cell', { name: categoryName, exact: true }) })

// BAD: .filter() when the constructor option suffices
page.getByRole('button').filter({ hasText: 'Submit' })

// BAD: index when name-based scoping is possible
page.getByRole('tab').nth(2)
```

## Assertions

### Locator Assertions (Auto-Retrying)

Locator assertions poll until the condition is met or the timeout expires. Always prefer these.

```typescript
// GOOD: page and element state
await expect(page).toHaveTitle('InvenTree Demo Server | Dashboard')
await expect(page).toHaveURL(/\/web\/part\/\d+\/details$/)
await expect(page.getByRole('row', { name: 'Active No', exact: true })).toBeVisible()
await expect(page.getByRole('menuitem', { name: 'action-menu-part-actions-delete' })).toBeDisabled()
await expect(addPartDialog.getByRole('textbox', { name: 'text-field-name' })).toHaveAttribute('aria-invalid', 'true')
await expect(page.getByRole('button', { name: 'action-menu-add-parts' })).toHaveCount(0)
```

Prefer `toHaveText` / `toContainText` on a unique locator over `getByText(...).toBeVisible()` — it asserts the content directly.

### Generic Assertions (No Retry)

Avoid generic assertions.

```typescript
// BAD: generic assertion — no retry, race-condition prone
const titleText = await page.title()
expect(titleText).toBe('InvenTree Demo Server | Dashboard')

// BAD: manual check — does not retry
const isVisible = await page.getByRole('dialog', { name: 'Add Part' }).isVisible()
expect(isVisible).toBe(true)
```

### Negative Assertions

After an action that changes the DOM, wait for that change **before** asserting absence — otherwise the assertion can pass against the old DOM.

```typescript
// GOOD: wait for the filtered search request before asserting the table is empty
const searchResponse = page.waitForResponse(response => {
  const url = new URL(response.url())
  return url.pathname === '/api/part/' && url.searchParams.get('search') === searchTerm && response.ok()
})
await page.getByRole('tabpanel', { name: 'Parts' }).getByRole('textbox', { name: 'table-search-input' }).fill(searchTerm)
await searchResponse
await expect(page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row', { name: /^Select record \d+ / })).toHaveCount(0)

// GOOD: confirm the dialog closed after submitting
await expect(page.getByRole('dialog', { name: 'Edit Part' })).toBeHidden()
```

For permission tests (`reader` role), first confirm the page has loaded its data (e.g. a table row is visible), then assert the action is absent with `toHaveCount(0)`.

### No Soft Assertions

Do not use `expect.soft()`. Every assertion should fail the test immediately.

## Waiting

### Playwright Auto-Waits on Actions

`click()`, `fill()`, `check()`, `setChecked()` all auto-wait for the element to be actionable and auto-scroll to it. Do NOT add explicit waits or `scrollIntoViewIfNeeded()` before actions.

```typescript
// GOOD: auto-waits for the menu item to be ready
await page.getByRole('menuitem', { name: 'action-menu-part-actions-edit' }).click()

// BAD: redundant wait
await page.getByRole('menuitem', { name: 'action-menu-part-actions-edit' }).waitFor()
await page.getByRole('menuitem', { name: 'action-menu-part-actions-edit' }).click()
```

### When You Need Explicit Waits

Add explicit waits only before steps that do **not** auto-wait: `all()`, `count()`, `allTextContents()`, `textContent()`, `inputValue()`.

InvenTree tables load their rows from the API after the page renders, so gate non-auto-waiting reads on a visible row or on the API response.

```typescript
// GOOD: locator assertion auto-waits after navigation — no waitForURL needed
await page.getByRole('tablist').getByRole('link', { name: 'Parts' }).click()
await expect(page).toHaveURL(/\/web\/part\//)

// GOOD: wait for the row before reading its text
await expect(firstPartRow).toBeVisible()
const partNameValue = (await firstPartRow.getByRole('cell', { name: /^Thumbnail / }).textContent())!.trim()

// GOOD: wait for a specific API call triggered by the action
const loginResponse = page.waitForResponse(response => response.url().includes('/api/auth/v1/auth/login') && response.status() === 200)
await page.getByRole('button', { name: 'Log In' }).click()
await loginResponse
```

### Never Use Arbitrary Timeouts

```typescript
// BAD: slow, unreliable, hides real issues
await page.waitForTimeout(3000)
```

### No Custom Timeouts by Default

Rely on the timeouts in `playwright.config.ts`: UI projects already allow 10s per assertion and 90s per test for the slow demo server. Do not add custom timeouts to:
- `test.setTimeout()`
- `toBeVisible({ timeout: ... })` or any other assertion
- `waitForURL(..., { timeout: ... })`
- Any other method that accepts an optional `timeout` parameter

Custom timeouts are allowed **only as a debugging fix** — when a test fails on a timeout and investigation shows the configured timeout is genuinely too short for that step. Never add them preemptively.

## Test Structure

### Naming Convention

Test names describe **user behavior** and start with the role that performs it.

```typescript
// GOOD: role + behavior
test('Engineer can create a part with only the required fields', ...)
test('Engineer cannot delete a locked part', ...)
test('Read-only user cannot edit or delete a part', ...)
test('Stock user can create a part, add a parameter and stock, and find it in the parent category', ...)

// BAD: describes implementation
test('test part form', ...)
test('POST /api/part/ should return 201', ...)
test('PartsPage renders', ...)
```

### Always Start from the Dashboard

Every UI test starts at the InvenTree dashboard (`/web/home`) through `pom.homePage.open()`, and reaches inner pages through the UI. Never `goto` an inner page such as `/web/part/123/details` — record IDs on the shared demo server are not stable, and the journey through the UI is part of what is being tested.

```typescript
// GOOD: starts at the dashboard, navigates via the header
test.beforeEach(async ({ pom }) => {
  await pom.homePage.open()
})

test('Engineer can edit a part description', async ({ pom, partCleanup }) => {
  await pom.homePage.openParts()
  // ...
})

// BAD: jumps straight to an inner page by ID
test.beforeEach(async ({ page }) => {
  await page.goto('/web/part/42/details')
})
```

### Grouping with describe

Group tests by feature area, one `describe` per spec file, with the shared start in `beforeEach`:

```typescript
test.describe('Part management', () => {
  test.beforeEach(async ({ pom }) => {
    await pom.homePage.open()
  })

  test('Engineer can edit a part description', async ({ pom, partCleanup }) => { ... })
  test('Engineer can deactivate and then delete a part', async ({ pom, partCleanup }) => { ... })
  test('Engineer cannot delete a locked part', async ({ pom, partCleanup }) => { ... })
})
```

### One Logical Flow Per Test

Each test verifies one user journey. Avoid combining unrelated assertions.

```typescript
// GOOD: focused test
test('Engineer cannot delete a locked part', async ({ pom, partCleanup }) => {
  const newPartValues = getNewPartValues('Resistors')
  await pom.homePage.openParts()
  partCleanup.register(await pom.partsPage.createPart(newPartValues))
  await pom.partDetailPage.editPart({ locked: true, active: false })
  await pom.partDetailPage.attemptDeletePart()
  await pom.partDetailPage.expectDeleteRefused('Cannot delete this part as it is locked')
})

// BAD: tests multiple unrelated things
test('parts', async ({ pom }) => {
  // creates a part, then edits a category, then checks stock, then deletes everything...
})
```

### Test Data

- Create the records a test needs with unique, prefixed names from `playwright-utils/ui/helpers/test-data.ts` (`PW ...`), so parallel runs and other demo users don't collide.
- Register every created part or category with `partCleanup` / `categoryCleanup` right after creating it.
- Use existing demo data only for stable reference data (e.g. the `Resistors` category, the `Factory` location), never for records the test changes.

## Test Code Style

### Locator Constants

Extract locators into constants **only** when:
- The locator is **repeated 3+ times** in the method or test
- The locator is **not self-descriptive** AND is used **2+ times**

Do NOT extract locators into constants when:
- The locator is **self-descriptive** AND used only **1–2 times**
- The constant is only an **intermediate step** to build another locator — inline the chain instead

```typescript
// GOOD: the dialog is used for every field and the submit — a constant is justified
const addPartDialog = page.getByRole('dialog', { name: 'Add Part' })
await addPartDialog.getByRole('textbox', { name: 'text-field-name' }).fill(partValues.name)
await addPartDialog.getByRole('textbox', { name: 'text-field-description' }).fill(partValues.description)
await addPartDialog.getByRole('button', { name: 'Submit' }).click()

// BAD: intermediate constants used only to build the next one
const partsPanel = page.getByRole('tabpanel', { name: 'Parts' })
const partRows = partsPanel.getByRole('row')
const firstPartRow = partRows.nth(1)

// GOOD: inline the chain
const firstPartRow = page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row', { name: /^Select record 1 / })
```

### Reuse Locator Constants

Locators are lazy — they re-resolve against the current DOM on every use. Reuse the same constant across all phases (including after saving, navigating or reloading). Do not re-declare the same locator under names like `*AfterUpdate` or `*AfterSave`.

```typescript
// BAD
const partRow = page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row').filter({ hasText: partName })
// ... edit the part and come back ...
const partRowAfterUpdate = page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row').filter({ hasText: partName })

// GOOD — reuse the existing constant
await expect(partRow).toContainText(updatedDescription)
```

### Variable Naming

Use **descriptive names** — no abbreviations or acronyms. Name the variable after **what it holds**. When `textContent()`, `allTextContents()` or `inputValue()` returns text, end the name with **`Value(s)`** or **`Texts`**; reserve element-type names (`Row`, `Dialog`, `Tab`) for locators.

```typescript
// BAD: abbreviation, and "Row" implies a locator but this is a string
const pnRow = await firstPartRow.getByRole('cell', { name: /^Thumbnail / }).textContent()

// GOOD: "Value" suffix for the extracted text
const partNameValue = (await firstPartRow.getByRole('cell', { name: /^Thumbnail / }).textContent())!.trim()

// GOOD: locator variable — element-type name is appropriate
const firstPartRow = page.getByRole('tabpanel', { name: 'Parts' }).getByRole('row', { name: /^Select record 1 / })
```

## Actions

### Repeated Clicks on the Same Element

When the exact same element is clicked several times in a row with nothing in between, pass `clickCount` to one `click()` instead of repeating the line.

```typescript
// BAD
await stepButton.click()
await stepButton.click()

// GOOD
await stepButton.click({ clickCount: 2 })
```

If the element may change, disappear or become disabled between clicks, keep separate lines so each click re-resolves the locator.

## Form Interactions

InvenTree forms open in a dialog. Scope every field to that dialog, then submit and confirm the outcome (the dialog closes, or the URL changes to the new record).

```typescript
const addPartDialog = page.getByRole('dialog', { name: 'Add Part' })

// Text and number fields — fill() replaces any existing value, no clear() needed
await addPartDialog.getByRole('textbox', { name: 'text-field-name' }).fill(partValues.name)
await addPartDialog.getByRole('textbox', { name: 'number-field-minimum_stock' }).fill('5')

// Tree picker (category, location): type, then choose from the listbox
await addPartDialog.getByRole('textbox', { name: 'tree-field-category' }).fill('Resistors')
await page.getByRole('listbox').getByRole('option', { name: 'Resistors' }).click()

// Related-object picker: type into the combobox, then choose the exact option
await addParameterDialog.getByRole('combobox', { name: 'related-field-template' }).fill('Length')
await page.getByRole('option', { name: 'Length Part length [mm]', exact: true }).click()

// Boolean field (switch)
await editPartDialog.getByRole('switch', { name: 'boolean-field-active' }).setChecked(false)

// Submit and confirm
await addPartDialog.getByRole('button', { name: 'Submit' }).click()
await expect(page).toHaveURL(/\/web\/part\/\d+\/details$/)
```

Pickers render their options outside the dialog, so locate `listbox` / `option` from `page`, not from the dialog.
