# CONVENTIONS.md

Read this file before starting any task in this repo. When a prompt says
"follow CONVENTIONS.md," it means everything below applies without
needing to be restated.

## Project context

This is the Car Dealership Inventory System. Auth, vehicle CRUD, search,
purchase, restock, the admin panel, the responsive UI, and the seed
script are all implemented and committed. Assume these are done and
working unless a task explicitly says otherwise — don't re-verify or
re-implement them as a side effect of an unrelated task.

## TDD discipline

- Write the failing test(s) first. Run them and confirm they fail for a
  clean, expected reason (a real assertion mismatch, not a crash or
  import error) before writing any implementation.
- Only then implement, following any TODO comments already in the target
  file — they describe the exact expected behavior, edge cases, and
  status codes.
- Don't touch files outside the stated scope of the current task, even if
  they look related — if something outside scope seems broken, stop and
  flag it instead of fixing it inline.

## Design system

- Read `DESIGN.md` before writing or changing any frontend UI. Reuse
  existing components (`Button`, `Badge`, `StockGauge`, `VehicleCard`)
  and never introduce a color or font outside the token table there.

## Verification before showing a diff

- Run the full test suite and `npx tsc --noEmit` (backend) /
  `npm run build` (frontend) before presenting any diff.
- If a test is meant to prove something specific (e.g. "proves DB
  persistence," "closes a race condition"), make sure it actually
  exercises that condition — e.g. a persistence test should re-fetch the
  row, not just check the response; a race-condition test should fire
  concurrent requests with `Promise.all`, not sequential awaits.
- Show the full diff and stop. Do not commit until told to.
- If the task touches backend logic, run the full test suite with
  coverage (`npm run test:coverage`) at the end and paste the summary
  (pass count, and the stmts/branch/lines percentages) — not just "tests
  pass."

## Commit format

Every commit that involved AI assistance gets:
1. A concise imperative subject line.
2. A body paragraph distinguishing what was AI-generated vs. what was
   reviewed/adjusted — specific, not "AI helped with this."
3. This exact trailer:
   ```
   Co-authored-by: Cursor (Claude Opus 4.8) <noreply@cursor.sh>
   ```

## Prompt log

After finishing a task, remind me to add an entry to `PROMPTS.md` — don't
add it yourself, since the log is written from my perspective, but flag
it if I forget before moving to the next task.

## Scope discipline

If a request seems to require changing something already marked done in
a prior commit, say so explicitly and ask before proceeding, rather than
quietly expanding scope.