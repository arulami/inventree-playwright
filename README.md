# inventree-playwright

Playwright (TypeScript) tests for [InvenTree](https://inventree.org), the open-source inventory management system. The suites run against either a local InvenTree in Docker (recommended) or the public demo server at <https://demo.inventree.org>, which anyone can use and which resets every 24 hours.

The repo contains:

- **API tests** for the Parts REST API: smoke, CRUD, validation (required, null, length, type), permissions, locked parts and pagination.
- **UI tests** written with the Page Object Model: part creation and form validation, editing, deactivating, locking and deleting parts, categories, read-only access, and a cross-functional flow (create a part → add a parameter → add stock → find it in the category view).
- **Manual test cases** for the Parts module: 256 UI and 153 API cases traced to requirements, under [`manual-tests/`](manual-tests/README.md).

## Prerequisites

- **Node.js 20 or later**
- **Docker Desktop** (or Docker Engine with Compose v2), for the local server
- **Ports 80 and 443 free** on your machine; the local server's proxy binds to them

## Setup

```bash
npm install
npx playwright install chromium
```

Create a `.env` file in the repo root. It is git-ignored. The same accounts exist on the demo server and in the local Docker dataset; their passwords are listed on the [InvenTree demo page](https://inventree.org/demo.html):

```dotenv
INVENTREE_USERNAME=engineer
INVENTREE_PASSWORD=<engineer password>
INVENTREE_READER_USERNAME=reader
INVENTREE_READER_PASSWORD=<reader password>
INVENTREE_STOCK_USERNAME=allaccess
INVENTREE_STOCK_PASSWORD=<allaccess password>
```

The engineer account can manage parts. The reader account is read-only and is used for permission checks. The allaccess account can also create stock, which the cross-functional UI flow needs. Every test cleans up the parts and categories it creates.

## Run the tests against a local InvenTree in Docker

`docker-compose.yml` at the project root runs PostgreSQL, Redis, the InvenTree server and worker (version 1.5.8), and a Caddy proxy on <http://localhost>. Its settings are in `docker/inventree.env`, and its data lives in `docker/data/` (git-ignored).

### First time: start the server and load the test data

```bash
docker compose up -d --wait                                      # pull images and start; returns when all services are healthy
docker exec inventree-server invoke dev.setup-test -b 1.5.x -i   # load the InvenTree demo dataset (replaces the database)
docker exec inventree-server invoke int.rebuild-models           # repair the part/category trees after the import
docker exec inventree-server invoke static                       # collect the web UI files into docker/data
```

The first start downloads the images and can take a few minutes. The dataset provides the same `engineer`, `reader` and `allaccess` accounts as the demo server, so `.env` works unchanged. To check the server, open <http://localhost> and log in as any of those accounts, or as `admin` / `inventree` (a superuser; don't use it for tests).

### Run

```bash
TEST_ENV=local npx playwright test                               # everything (API and UI)
TEST_ENV=local npx playwright test --project=api-testing         # API tests only
TEST_ENV=local npx playwright test --project=ui-engineer         # UI tests as engineer
TEST_ENV=local npx playwright test --project=ui-reader           # UI tests as the read-only user
TEST_ENV=local npx playwright test --project=ui-stock            # cross-functional stock flow (allaccess)
TEST_ENV=local npx playwright test -g "Engineer can edit a part description"   # one test by title

npx playwright show-report                                       # open the HTML report of the last run
```

Local runs use one worker: InvenTree's part tree breaks when several parts are created at the same moment against a fast local server. The full suite takes about a minute and a half.

### Stop, restart and reset

```bash
docker compose stop                                              # stop the server, keep its data
docker compose up -d --wait                                      # start it again; no need to reload the data
docker compose down                                              # remove the containers, keep docker/data/
```

To return to a clean dataset, run the three `docker exec` setup commands again. To remove everything, including the database, run `docker compose down` and then delete the `docker/data/` folder.

### Troubleshooting

| Symptom | Fix |
|---|---|
| The web UI shows "If you see this text there might be an issue with your update" (INVE-E1) | `docker exec inventree-server invoke static` |
| API calls return 500 and the server log says "More than one root node with tree_id …" | `docker exec inventree-server invoke int.rebuild-models` |
| Login fails with "Too many failed login attempts" | InvenTree allows 5 login attempts per minute per IP; wait a minute. The auth setup reuses saved sessions, so this only happens after the sessions expire or the data is reloaded |
| `docker compose up` fails because port 80 or 443 is in use | Stop whatever is using the port (another web server, or an older InvenTree stack) and start again |

Note that `INVENTREE_TAG` (the image version, 1.5.8 by default) must match the dataset branch passed to `dev.setup-test` (`1.5.x`).

## Run the tests against the public demo server

`TEST_ENV` selects the target. It defaults to `dev`, the shared demo server, so the same commands work without `TEST_ENV=local`:

```bash
npx playwright test --project=api-testing
npx playwright test
```

The demo server is shared and slower, and it occasionally drops requests; CI runs retry twice. Anyone can change the demo accounts' settings, so the UI tests pin the interface language to English.

For other environments, `qa` and `prod` also need `INVENTREE_API_URL`:

```bash
TEST_ENV=qa INVENTREE_API_URL=https://inventree.example.com/api npx playwright test --project=api-testing
```

## Reports and debugging

Every run writes an HTML report to `playwright-report/` (open it with `npx playwright show-report`) and a trace for each failed test under `test-results/`. Add `--trace on` to record a trace for every test. Run `npx tsc --noEmit` to type-check.

## Project layout

| Path | Contents |
|---|---|
| `tests/api-tests/` | API specs |
| `tests/ui-tests/` | Login setup and UI specs, grouped by user role (`engineer/`, `reader/`, `stock/`) |
| `playwright-utils/api/` | Request builder, fixtures, logging, custom matchers, schema validation, test data |
| `playwright-utils/ui/` | Page objects, the `PageManager`, UI fixtures and helpers |
| `request-objects/` | Base request bodies |
| `response-schemas/` | JSON schemas the API responses are checked against |
| `helpers/` | API token creation and part/category cleanup, shared by both suites |
| `manual-tests/` | Manual test cases, requirements, and traceability |
| `docker-compose.yml`, `docker/` | Local InvenTree server for `TEST_ENV=local` |
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
