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
