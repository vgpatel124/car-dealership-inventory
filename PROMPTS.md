# AI Prompt Log

> **Rule for this project:** every AI prompt used while building this project
> must be logged here, in chronological order. This creates an honest, auditable
> trail of how AI was used during the TDD kata. Record the prompt (verbatim or
> closely paraphrased), the tool/model, and a one-line note on the outcome.

## How to add an entry

Copy the template below to the bottom of the log for each new prompt.

```
### YYYY-MM-DD HH:MM — <short title>
- **Tool/Model:** <e.g. Cursor + Claude>
- **Prompt:**
  > <the prompt text>
- **Outcome:** <what changed / what you accepted or rejected>
```

---

## Log

### 2026-07-26 — Initial project scaffold
- **Tool/Model:** Cursor
- **Prompt:**
  > Set up the full-stack Car Dealership Inventory System scaffold (Express/TS/
  > SQLite backend + React/Tailwind frontend), wire all routes to 501 stubs,
  > write failing Red tests for POST /api/auth/register, then run setup commands
  > and stop before implementing business logic.
- **Outcome:** Full folder structure created; backend routes return 501; auth
  register tests written (Red); frontend design system + demo dashboard built.

### 2026-07-26 — Vehicle listing, creation, and search (TDD)
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Add vehicle.test.ts covering POST /api/vehicles (create, 201, 400 on
  > negative price/quantity), GET /api/vehicles (list), and
  > GET /api/vehicles/search (case-insensitive make/model/category +
  > minPrice/maxPrice, combinable). Add a tests/helpers/auth.ts that registers
  > a user and returns a JWT via the real auth endpoints. Run the tests first
  > and confirm they fail against the 501 stubs (Red), then implement
  > listVehicles/createVehicle/searchVehicles and wire the controller with the
  > right status codes. Don't touch update/delete/purchase/restock.
- **Outcome:** Red confirmed against the 501 stubs, then implemented the three
  services + controller wiring (add `VehicleError` mirroring `AuthError`).
  `npm test` green (16/16) and `npx tsc --noEmit` clean.

#### Follow-up — closing review gaps on createVehicle
- **Prompt:**
  > Two follow-ups: (1) make the "quantity defaults to 0" test re-fetch the row
  > directly via prisma.vehicle.findUnique and assert quantity is 0 there too,
  > proving DB persistence rather than trusting the response body; (2) the
  > schema's @default(0) was dead code because createVehicle always sends an
  > explicit quantity — pick option (a): keep the TypeScript default and note in
  > schema.prisma that @default(0) is a defensive fallback, choosing whichever
  > is most consistent with the existing price validation.
- **Outcome:** Added an independent `prisma.vehicle.findUnique` assertion to the
  quantity-default test; kept the TypeScript default (option a) as it matches
  how `price` is already validated in the service, and annotated `@default(0)`
  in `schema.prisma` as a defensive fallback. Tests still green (16/16), tsc
  clean. Folded into the same feature commit rather than a separate fixup.

### 2026-07-26 — Auth implementation (register/login)
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Implement registerUser and loginUser following the TODO comments in
  > auth.service.ts (bcryptjs hashing, duplicate-email 409, missing-field 400,
  > JWT signing). Update auth.controller.ts to return correct status codes
  > instead of 501. Run tests until all pass.
- **Outcome:** All 4 tests in auth.test.ts passing. Added an `AuthError` class
  for status-code mapping and a bcrypt timing mitigation on login (compares
  against a dummy hash when the user isn't found, to avoid a user-enumeration
  side channel). Reviewed the diff before committing.

### 2026-07-26 — Git recovery after a folder-flattening mishap
- **Tool/Model:** Claude (Anthropic), troubleshooting conversation
- **Prompt:** (not a code-generation prompt) — asked for help after a mv
command intended to flatten a nested project folder instead matched ..
and left a stray empty .git repo at the home directory, making the
original scaffold + auth commits unreachable from the project folder.
- **Outcome:** Confirmed no project files were lost and nothing had been
pushed to GitHub yet. Removed the stray empty repo, re-initialized git
cleanly inside the correct project folder, and made one honest commit
(chore: restore project locally after a git tooling mishap...) documenting
the recovery rather than fabricating the original two-commit history.

### 2026-07-26 — Vehicle update, delete, purchase, restock (TDD)
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Extend vehicle.test.ts with PUT (401/200/404), DELETE (401/403-USER/
  > 204-ADMIN/404, needs an admin test helper via direct Prisma insert),
  > purchase (401/200-decrement/409, plus a concurrent-purchase test using
  > Promise.all asserting exactly one of two simultaneous requests succeeds),
  > and restock (401/403-USER/200-increment). Implement using a single atomic
  > updateMany with a quantity-gt-0 guard for purchase, not read-then-write.
- **Outcome:** 30/30 tests passing, tsc clean. `purchaseVehicle` uses an
  atomic guarded `updateMany` inspecting `count` to distinguish 409 (already
  sold out) from 404 (missing) — confirmed the concurrent test 5/5. Verified
  `requireAdmin` was already correctly applied to delete/restock routes.

### 2026-07-26 — Follow-up review before Phase 3 commit
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Review the current implementation against a checklist (price/quantity
  > validation, search filter gte/lte/AND correctness, SQLite mode:insensitive
  > limitation, quantity-default DB persistence) — cite specific files/lines/
  > test names, don't modify anything, output findings only.
- **Outcome:** No functional bugs found; confirmed SQLite's LIKE is already
  ASCII case-insensitive without needing `mode: 'insensitive'` (unsupported on
  SQLite). Findings folded into the earlier vehicle-search follow-up commit.

### 2026-07-26 — Frontend wiring: API client, auth context, dashboard
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Create src/lib/api.ts (typed fetch wrapper for all 9 endpoints via the
  > Vite dev proxy, JWT via Authorization header) and AuthContext.tsx (React
  > state only, no localStorage). Build login/register forms with inline
  > backend error messages. Replace SAMPLE_VEHICLES with a real GET
  > /api/vehicles call (loading + error states). Wire Purchase to POST
  > /api/vehicles/:id/purchase with optimistic local state update and a 409
  > message.
- **Outcome:** `npm run build` clean. Verified manually: registration,
  dashboard load from the real API, purchase decrementing the stock gauge,
  rejected login on wrong credentials, 409 on sold-out purchase. Fixed
  API_BASE to use the Vite dev proxy (relative paths) instead of a hardcoded
  localhost:4000 URL, avoiding CORS.

### 2026-07-26 — Confirm-password validation on registration
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Split the login form (email + password) from the register form (email +
  > password + confirm password), with client-side validation blocking the
  > API call and showing an inline error on mismatch. Confirm Password is
  > never sent to the backend.
- **Outcome:** Mismatched passwords block submission with an inline error;
  matching passwords register successfully. Switching modes clears the field
  and any stale error.

### 2026-07-26 — Search/filter UI and admin panel
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Add a search/filter bar (make/model/category/min/max price) wired to
  > GET /api/vehicles/search, with a distinct empty-state message for
  > no-results vs. empty catalog. Build an admin-only panel (gated on
  > user.role) with add/edit(modal)/delete(confirm-gated)/restock, each
  > updating local state without a full refetch.
- **Outcome:** Explicit Search/Clear chosen over debounced search (predictable
  request volume, no out-of-order response races — noted in-file). Verified
  combined-filter search, both empty states, and the full admin flow as a
  promoted user; confirmed the panel is absent for a regular user.

### 2026-07-26 — Fix: isolate test database from dev database
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Jest was writing to the same dev.db the UI uses, leaving garbage test
  > vehicles/users visible. Add a separate .env.test/test.db for the test
  > suite and purge the stale rows from dev.db.
- **Outcome:** Test runs no longer pollute the dev database. Confirmed via
  row-count check before/after `npm test`.

### 2026-07-26 — Fix: wire sidebar navigation
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > The Inventory/Search/Admin sidebar buttons had no onClick handlers (static
  > leftovers from the original scaffold). Add view state, wire both buttons,
  > gate the admin panel on the Admin view being active AND user.role ===
  > ADMIN.
- **Outcome:** Real view-switching with a generalized active-state highlight
  (config array + `aria-current`) replacing the old hardcoded `i === 0`
  styling. Search merged into the Inventory view (jumps/focuses the filter
  bar) rather than being a dead third view.

### 2026-07-26 — Responsive layout and UX polish
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Make the sidebar collapse below 640px (drawer or icon rail), confirm the
  > grid reflows 1/2/3/4 columns across breakpoints, audit keyboard focus,
  > add a loading skeleton, fix disabled-button contrast, confirm
  > prefers-reduced-motion is respected.
- **Outcome:** Chose a slide-out drawer (short nav labels don't read well as
  icons). Fixed a 640-767px dead zone where no nav was visible at all.
  Disabled-button contrast improved to ~5.8:1 (token-based fill instead of
  opacity). Manually verified at 375px/768px/1440px including keyboard-only
  navigation through the drawer.

### 2026-07-26 — Database seed script
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Add an idempotent Prisma seed script creating one ADMIN and one USER test
  > account (bcrypt via the same hashing path as registerUser) and 6-8 sample
  > vehicles including a sold-out and a low-stock example, since there was no
  > way for a fresh clone to reach the admin panel or see populated data
  > without manual Prisma Studio edits.
- **Outcome:** Extracted `hashPassword()` in auth.service.ts as a shared
  source of truth. Verified idempotency (running twice produced no
  duplicates) and that all 30 existing tests still pass. Documented both test
  accounts in README.

### 2026-07-26 — Closing test coverage gaps
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Run test:coverage, then add tests for invalid/expired/missing JWT,
  > non-admin 403s, purchase/update on nonexistent ids, empty-string (not
  > just missing) register fields, and login edge cases (wrong password,
  > unknown email, success) — login previously had zero direct tests.
- **Outcome:** Coverage moved from 86.57%/72.89%/87.86% to
  87.98%/75.70%/88.97% (stmts/branch/lines) across 40 tests. No bugs found;
  all new tests passed against the existing implementation on first run. Left
  one branch (requireAdmin's req.user-unset case) intentionally uncovered as
  unreachable dead code given authenticate always runs first.

### 2026-07-26 — Purchase interaction: loading state, toast, animated gauge
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Follow CONVENTIONS.md and Add a "Purchasing..." disabled button state during the request, a
  > moss-toned auto-dismissing success toast, an animated StockGauge
  > transition (stroke-dashoffset + rotated needle instead of redrawing the
  > arc), and a proper zero-quantity transition (ember gauge, "Out of stock"
  > badge, disabled "Sold out" button) — all without a refresh, and reverting
  > cleanly with no toast on a 409.
- **Outcome:** Verified manually: >1-qty purchase animation, purchase-to-zero
  transition, and a 409 via a second tab. Reduced-motion respected (instant
  value update, no tween).

### 2026-07-26 — Auth screen hero visual and dashboard hover polish
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Follow CONVENTIONS.md and Add an inline line-art car SVG and subtitle above the logo on the
  > login/register screen, a subtle gradient background (existing tokens
  > only), and a lift-on-hover transition on VehicleCard (respecting
  > prefers-reduced-motion), keeping StockGauge as the clear focal point.
- **Outcome:** Verified visually; no new colors introduced outside
  DESIGN.md's token table.

### 2026-07-26 — Register should not auto-login
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Follow CONVENTIONS.md and Registration currently logs the user in immediately via the token in the response. Change this so a successful register shows a success message and switches to the login view (email pre-filled), requiring the user to enter their password and click Login separately.
- **Outcome:** Frontend-only flow change; backend register test unaffected.

### 2026-07-26 — Session guard: never show login screen while authenticated
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Follow CONVENTIONS.md and Add a guard so AuthPanel never renders while AuthContext has a valid
  > user/token — including after browser back/forward navigation — and
  > confirm logout fully clears context back to AuthPanel with no residual
  > Dashboard flash. Token storage stays React-state-only, no persistence
  > added.
- **Outcome:** Confirmed and hardened the existing single unconditional
  render check in App.tsx; verified manually with back-navigation after
  login and after logout.

### 2026-07-26 — Backend code quality review (no behavior change)
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Perform a final code quality review, backend only. Do not change
  > behavior, APIs, schema, UI, or tests except for lint/type fixes. Remove
  > duplicate code, improve names, replace magic values with named
  > constants, improve error-handling consistency, remove dead code, keep
  > functions small. Remove comments that just restate the code; keep only
  > comments explaining non-obvious logic, security, or concurrency. Prove
  > no behavior changed with before/after test runs.
- **Outcome:** Introduced a shared `HttpError` base + `sendError` handler,
  collapsing `AuthError`/`VehicleError` and duplicate controller handlers.
  Extracted `requireCredentials()`/`toPublicUser()` and
  `assertNonNegativeNumber()` to dedupe repeated validation. Named several
  magic values (`PRISMA_UNIQUE_VIOLATION`, `DUMMY_BCRYPT_HASH`,
  `PRISMA_RECORD_NOT_FOUND`, `BEARER_PREFIX`, `DEFAULT_JWT_EXPIRES_IN`).
  Corrected a stale file-header comment falsely claiming several vehicle
  service functions were still unimplemented. 40/40 tests passed before and
  after, tsc clean. Specifically re-verified by name that the
  concurrent-purchase race-condition test and the login timing-mitigation
  test both still passed.

### 2026-07-26 — Follow-up: branch coverage investigation + PUT validation test
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Branch coverage dropped slightly (75.70% -> 74.72%) after the refactor
  > — explain exactly which branches changed and whether a real gap was
  > introduced, not just a denominator shift. If a genuine gap exists (e.g.
  > PUT never tested for negative price/quantity), add that test.
- **Outcome:** Confirmed the drop was mechanical (consolidating four inline
  checks into one shared, above-average-covered branch cluster lowers the
  file's average even though auth.service.ts hit 100% and two previously
  dead branches were eliminated). Added two tests confirming
  `PUT /api/vehicles/:id` already correctly rejects negative price/quantity
  via the same shared guard `createVehicle` uses — these were "already
  green" (locking in existing correct behavior), not a bug fix. Test count
  40 -> 42, all passing.

### 2026-07-26 — Frontend code quality review and comment cleanup (no behavior change)
- **Tool/Model:** Cursor + Claude Opus 4.8
- **Prompt:**
  > Perform a final code quality review, frontend only, plus a comments
  > pass across both frontend and backend. Remove duplicate JSX, simplify
  > component structure, remove unnecessary state/props (flag anything
  > uncertain rather than guessing), remove dead code/unused imports.
  > Remove comments that just restate the code; keep only ones explaining
  > non-obvious business logic, security, or concurrency. No test suite
  > exists on the frontend, so list every interactive element that could
  > plausibly be affected so I can manually re-verify.
- **Outcome:** `npm run build` clean before and after. Manually re-verified
  registration, login, purchase (both partial-stock and sold-out paths),
  combined-filter search, the full admin flow, and the mobile drawer — all
  behaved identically to before the pass.