# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Playwright (TypeScript) test framework for the InvenTree inventory system, targeting the public demo server `https://demo.inventree.org` (shared, reset every 24 h). It holds API tests, UI tests, and manual test case docs.

## Commands

There are no npm scripts; run Playwright directly. Tests are split into projects in `playwright.config.ts`:

```bash
npx playwright test --project=api-testing                    # all API tests
npx playwright test --project=ui-engineer                    # UI tests as engineer (runs ui-auth-setup first)
npx playwright test --project=ui-reader                      # UI tests as the read-only user
npx playwright test tests/api-tests/parts-crud.spec.ts --project=api-testing
npx playwright test -g "Engineer can update a part description"   # single test by title
npx playwright test --project=api-testing --trace on         # force a trace (default: retain-on-failure)
npx playwright show-report                                   # HTML report
npx tsc --noEmit                                             # type-check (no lint config exists)
node manual-tests/tools/validate-cases.mjs inventree         # check manual test case files
```

`TEST_ENV` selects the environment: `dev` (default) → the shared public demo server; `local` → a local InvenTree at `http://localhost` (override with `INVENTREE_BASE_URL`); `qa`/`prod` also need `INVENTREE_API_URL`. Both the API URL and the UI `baseURL` come from `api-test.config.ts`.

For `local`, `docker-compose.yml` in the project root starts InvenTree (settings in `docker/inventree.env`, data in git-ignored `docker/data/`; image pinned to 1.5.8). Set it up with `docker compose up -d`, then `docker exec inventree-server invoke dev.setup-test -b 1.5.x -i` (loads the demo dataset, replacing the database), `invoke int.rebuild-models` (the import can leave the part/category trees inconsistent) and `invoke static`. The dataset provides the same `engineer` / `reader` / `allaccess` accounts as the demo. Local runs use one worker: parts created in parallel collide in InvenTree's part tree (duplicate MPTT tree ids → deadlocks and 500s); if that happens anyway, rerun `int.rebuild-models`.

`.env` (git-ignored) must define `INVENTREE_USERNAME`, `INVENTREE_PASSWORD` (demo `engineer` user, can manage parts) and `INVENTREE_READER_USERNAME`, `INVENTREE_READER_PASSWORD` (demo `reader`, read-only). `api-test.config.ts` throws at import time if any are missing, and **both** API and UI suites import it.

## Architecture

**API suite** (`tests/api-tests/`, `playwright-utils/api/`):
- Specs import `test` from `playwright-utils/api/fixtures.ts` and `expect` from `playwright-utils/api/custom-expect.ts`, never `expect` from `@playwright/test`.
- `RequestHandler` is a fluent builder (`.path().params().headers().body()` → `.getRequest(expectedStatus)`). It wraps each call in `test.step`, logs to `APILogger`, attaches the auth token, checks the status code, and resets its state after every request.
- Custom matchers (`shouldEqual`, `shouldBeLessThanOrEqual`, `shouldMatchSchema`) add the recent API activity to failure messages. The `api` fixture wires the per-test logger into them through `setCustomExpectLogger`.
- `shouldMatchSchema(dir, name)` validates against `response-schemas/<dir>/<name>_schema.json` with AJV. Passing `true` as the third argument regenerates that schema from the live response (genson-js).
- Payloads: base JSON in `request-objects/`, randomized by factories in `data-generator.ts` (structuredClone + faker).

**UI suite** (`tests/ui-tests/`, `playwright-utils/ui/`):
- Page Object Model: `PageManager` builds every page object and is exposed as the single `pom` fixture (`playwright-utils/ui/fixtures/index.ts`). New page objects must be registered there.
- `auth.setup.ts` logs in through the UI and saves one storage state per role (`playwright-utils/ui/.auth/engineer.json`, `reader.json`), used by the `ui-engineer` / `ui-reader` projects (spec folders `tests/ui-tests/engineer/`, `reader/`). A new role needs its own setup step plus a project.
- The demo accounts are shared and anyone can change their profile language, so the setup pins the browser-side UI language to English; locators rely on English labels.
- UI projects use a 10s assertion and 90s test timeout (set in `playwright.config.ts`) because the demo server loads pages through several slow sequential API calls. UI-created parts and categories are cleaned up through the API by the `partCleanup` / `categoryCleanup` fixtures.

**Shared across both suites:**
- `helpers/createToken.ts` gets an API token through `GET /user/token/?name=<unique>` with Basic auth. InvenTree issues a token only once per name, so the name must stay unique. Tokens are worker-scoped fixtures.
- `partCleanup.register(pk)`: both suites have this fixture. At teardown, `helpers/deletePart.ts` deactivates and then deletes each registered part (InvenTree refuses to delete active parts). UI tests create parts through the browser and clean them up through the API. Register every part a test creates.

## Conventions

Detailed, path-scoped rules in `.claude/rules/` load automatically when matching files are touched. Follow them:
- `playwright-api-architecture.md` / `playwright-api-scripting.md`: API framework and spec style
- `playwright-architecture.md` / `playwright-scripting.md`: POM rules (locators inline in methods, no tiny methods, strict page boundaries, `expect*` validation methods, role-based locators first)
- `manual-test-cases.md` / `manual-test-design.md`: `manual-tests/` format and how to derive cases (see `manual-tests/README.md`). Case IDs are append-only, and `traceability.md` counts must be updated when cases change.

Project skills in `.claude/skills/` (`pw-new-test`, `pw-api-new-test`, `pw-debug-test`, `pw-test-audit`, etc.) cover writing, debugging, and auditing tests. `mt-ui-test-cases` and `mt-api-test-cases` generate manual cases from requirements. API requirements come from the OpenAPI JSON at `https://demo.inventree.org/api/schema/?format=json` through `.claude/skills/mt-api-test-cases/scripts/openapi-digest.mjs`, because the rendered schema docs page is too large to read.

The demo server is shared: use the least-privileged account that covers the test, never write tests as `admin`, and don't depend on fixed record IDs. Look them up at runtime (e.g. the first category from `/part/category/`).
