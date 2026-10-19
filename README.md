# inventree-playwright

Playwright (TypeScript) tests for [InvenTree](https://inventree.org), the open-source inventory management system. The suites run against the public demo server at <https://demo.inventree.org>, which anyone can use and which resets every 24 hours.

The repo contains:

- **API tests** for the Parts REST API: smoke, CRUD, and negative/permission cases.
- **UI tests** written with the Page Object Model, starting with part creation.
- **Manual test cases** for the Parts module: 240 UI cases traced to requirements, under [`manual-tests/`](manual-tests/README.md).

## Setup

```bash
npm install
npx playwright install chromium
```

Create a `.env` file in the repo root. It is git-ignored. For the demo server, use its `engineer` and `reader` accounts, whose passwords are listed on the [InvenTree demo page](https://docs.inventree.org/en/stable/demo/):

```dotenv
INVENTREE_USERNAME=engineer
INVENTREE_PASSWORD=<engineer password>
INVENTREE_READER_USERNAME=reader
INVENTREE_READER_PASSWORD=<reader password>
INVENTREE_STOCK_USERNAME=allaccess
INVENTREE_STOCK_PASSWORD=<allaccess password>
```

The engineer account can manage parts. The reader account is read-only and is used for permission checks. The allaccess account can also create stock, which the cross-functional UI flow needs. Every test cleans up the parts it creates.

## Running tests

```bash
npx playwright test --project=api-testing      # API tests
npx playwright test --project=ui-engineer      # UI tests (logs in first via ui-auth-setup)
npx playwright test                            # everything

npx playwright test tests/api-tests/parts-crud.spec.ts --project=api-testing
npx playwright test -g "Engineer can update a part description"

npx playwright show-report                     # open the HTML report
npx tsc --noEmit                               # type-check
```

Traces are kept for failed tests. Add `--trace on` to record one for every test.

### Other environments

`TEST_ENV` selects the target. It defaults to `dev`, the shared demo server.

To run against a local InvenTree in Docker, load the demo dataset that matches the server's version, then use `TEST_ENV=local` (default `http://localhost`, or set `INVENTREE_BASE_URL`). The dataset includes the same `engineer`, `reader` and `allaccess` accounts, so `.env` works unchanged:

```bash
docker exec inventree-server invoke dev.setup-test -b 1.5.x -i   # replaces the local database
TEST_ENV=local npx playwright test
```

For `qa` or `prod`, also set `INVENTREE_API_URL`:

```bash
TEST_ENV=qa INVENTREE_API_URL=https://inventree.example.com/api npx playwright test --project=api-testing
```

## Project layout

| Path | Contents |
|---|---|
| `tests/api-tests/` | API specs |
| `tests/ui-tests/` | Login setup and UI specs, grouped by user role |
| `playwright-utils/api/` | Request builder, fixtures, logging, custom matchers, schema validation, test data |
| `playwright-utils/ui/` | Page objects, the `PageManager`, UI fixtures and helpers |
| `request-objects/` | Base request bodies |
| `response-schemas/` | JSON schemas the API responses are checked against |
| `helpers/` | API token creation and part cleanup, shared by both suites |
| `manual-tests/` | Manual test cases, requirements, and traceability |
| `api-test.config.ts` | Environment settings and credentials |

## Writing API tests

API specs use the project's `test` and `expect`, not the ones from `@playwright/test`:

```typescript
import { test } from '../../playwright-utils/api/fixtures'
import { expect } from '../../playwright-utils/api/custom-expect'

test('Engineer can list parts', async ({ api }) => {
    const partsResponse = await api
        .path('/part/')
        .params({ limit: 10 })
        .getRequest(200)
    await expect(partsResponse).shouldMatchSchema('parts', 'GET_parts')
})
```

Each request states the status code it expects. When a request or a `should*` assertion fails, the error message includes the test's recent requests and responses, with auth headers masked. To clean up a part a test creates, pass its `pk` to `partCleanup.register(pk)`.

Conventions for both suites are documented in [`.claude/rules/`](.claude/rules/).
