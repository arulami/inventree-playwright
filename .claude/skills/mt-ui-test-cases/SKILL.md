---
name: mt-ui-test-cases
description: Generate manual UI test cases from product documentation requirements. Ingests or refreshes `manual-tests/<product>/requirements/<module>.md` from a docs URL when needed, finds requirements with no or thin coverage, derives positive/negative/boundary/permission cases using the project's test design rules, confirms the draft with the user, then writes them to `manual-tests/<product>/ui/<module>/`, updates traceability and validates. For API cases use `mt-api-test-cases`; to automate cases use `pw-coverage-planner`.
---

Generate manual UI test cases for the module / area the user provided.

Scope: $ARGUMENTS

**Never skip `AskUserQuestion` steps in this skill, even if told to work autonomously.**

## Instructions

### 1. Anchor on the scope

From `$ARGUMENTS`, identify the **product** (default `inventree`), **module** (e.g. `parts`), and optionally an **area** (e.g. "revisions", "notifications") or a **docs URL**. If the module can't be identified, ask once with `AskUserQuestion`.

### 2. Read the conventions

Read, in full:
- `manual-tests/README.md`
- `.claude/rules/manual-test-cases.md` (format, IDs)
- `.claude/rules/manual-test-design.md` (what cases to derive)
- `manual-tests/<product>/test-data/<module>-environment.md`
- `manual-tests/<product>/traceability.md`

### 3. Make sure the requirements exist and are current

Requirements live in `manual-tests/<product>/requirements/<module>.md`.

- **Missing**, or the user gave a docs URL / asked to refresh → ingest:
  1. Fetch the root docs page with WebFetch. Find its sub-pages from the page's navigation or the site's `sitemap.xml`, and fetch each one. Large pages: fetch in parts; never fill gaps from memory.
  2. Write one row per testable statement: `| <AREA>-NN | <requirement> |`, grouped in numbered sections (`## 1. <topic> (`/<page>/`)`) so `§N` references work. Quote limits, defaults and setting names exactly (e.g. `PART_ENABLE_LOCKING`, default True).
  3. Start the file with the source header: pages ingested, fetch date, page dates if shown. Match the existing `parts.md` header.
- **Refreshing an existing file:** keep every existing ID and its meaning. Append new requirements with the next free number in their area; mark ones no longer in the docs `(retired)` instead of deleting. Summarise added / changed / retired IDs for the user.
- **Present and current** → use it as is.

### 4. Gap analysis

For the requested area (or the whole module if none):
1. List the requirement IDs in scope.
2. Collect every Req cited in `manual-tests/<product>/ui/<module>/*.md` (expand ranges like `VIEW-02..09`).
3. Classify each requirement: **uncovered** (no case), **thin** (only a positive case although it has a constraint, flag, state or role — see the design rule's techniques table), or **covered**.
4. Note the existing area file that fits, its ID prefix (e.g. `TC-NTF-`) and the next free number.

### 5. Draft the cases

Apply `manual-test-design.md` to the uncovered and thin requirements. Don't restate existing cases. For each draft case, have ready: ID, title, pre-conditions, steps, expected result, Pri, Type, Req, and ⚠ where the docs don't state the behaviour.

Collect any new shared data the cases need (users, seed parts, settings) for `test-data/`.

### 6. Confirm with the user

Use `AskUserQuestion` with a summary:
- target file(s) and ID range
- count per Type (F/N/B/P) and Pri (P1/P2/P3)
- requirements still uncovered after this batch, and why
- ⚠ cases and any new test data

Options: "Write cases", "Show the full draft first", "Narrow the scope". On "Show the full draft first", print the rows, then ask again.

### 7. Write

- Append rows to the matching `ui/<module>/NN-<area>.md`. If no area fits, create the next `NN-<area>.md` with the standard header line copied from an existing UI file (requirements · test data · legend links) and a `## 1. <Section>` heading.
- Add new shared data to `test-data/<module>-environment.md`.
- Update `traceability.md`: the area's UI count, any new row, and the totals.

### 8. Validate

Run `node manual-tests/tools/validate-cases.mjs <product>`. Fix every reported problem and re-run until it prints `OK`.

### 9. Report

Tell the user the file(s) and IDs written, requirements still uncovered, and the ⚠ cases to confirm against a running instance. Offer `pw-coverage-planner` to plan automation for the P1 cases.
