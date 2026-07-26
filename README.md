# Car Dealership Inventory System

A full-stack inventory management system for a car dealership, built as a
Test-Driven Development (TDD) kata for a job assessment. Admins can manage a
vehicle catalog; users can browse, search, and purchase vehicles. Inventory
quantity is the heart of the system, so stock levels are surfaced visually with
a signature fuel-gauge-style **StockGauge**.

> **Status:** scaffold complete. Business logic (auth + vehicle services) is
> intentionally left unimplemented so it can be built test-first (Red → Green →
> Refactor). Controllers currently return `501 Not implemented`.

## Tech stack

**Backend**
- Node.js + TypeScript
- Express (REST API)
- SQLite via Prisma ORM (file-based database, not in-memory)
- JWT authentication (`jsonwebtoken`) + `bcryptjs` password hashing
- Jest + Supertest for tests

**Frontend**
- React + TypeScript
- Vite (dev server + build)
- Tailwind CSS (custom design tokens)

## Folder structure

```
car-dealership-inventory/
├── .gitignore
├── DESIGN.md              # Design system: colors, fonts, layout
├── PROMPTS.md             # Chronological log of AI prompts used
├── README.md
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── app.ts             # Express app (exported for tests)
│   │   ├── server.ts          # Boots the HTTP server
│   │   ├── routes/            # auth.routes.ts, vehicle.routes.ts
│   │   ├── controllers/       # auth.controller.ts, vehicle.controller.ts
│   │   ├── services/          # auth.service.ts, vehicle.service.ts
│   │   ├── middleware/        # auth.middleware.ts (authenticate, requireAdmin)
│   │   └── utils/             # jwt.ts, prisma.ts
│   └── tests/auth.test.ts
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── types.ts
        └── components/         # Button, Badge, StockGauge, VehicleCard
```

## API overview

| Method | Path                          | Auth        | Notes                                   |
| ------ | ----------------------------- | ----------- | --------------------------------------- |
| POST   | `/api/auth/register`          | public      | Returns token + user (no passwordHash)  |
| POST   | `/api/auth/login`             | public      | Returns token + user                    |
| POST   | `/api/vehicles`               | user        | Create a vehicle                        |
| GET    | `/api/vehicles`               | user        | List all vehicles                       |
| GET    | `/api/vehicles/search`        | user        | Filter by make/model/category/price     |
| PUT    | `/api/vehicles/:id`           | user        | Update a vehicle                        |
| DELETE | `/api/vehicles/:id`           | **admin**   | Delete a vehicle                        |
| POST   | `/api/vehicles/:id/purchase`  | user        | Atomic quantity decrement               |
| POST   | `/api/vehicles/:id/restock`   | **admin**   | Atomic quantity increment               |

## Local setup

### Backend

```bash
cd backend
npm install
cp .env.example .env

# Generate a strong JWT secret and paste it into .env as JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npx prisma generate
npx prisma migrate dev --name init

npm test          # runs Jest + Supertest
npm run dev       # starts the API on http://localhost:4000
```

Environment variables (see `.env.example`):

| Variable         | Example              | Purpose                        |
| ---------------- | -------------------- | ------------------------------ |
| `DATABASE_URL`   | `file:./dev.db`      | SQLite database file path      |
| `JWT_SECRET`     | (generated hex)      | Signs/verifies JWTs            |
| `JWT_EXPIRES_IN` | `1d`                 | Token lifetime                 |
| `PORT`           | `4000`               | API port                       |

#### Promoting a user to ADMIN (local testing)

The public `POST /api/auth/register` endpoint only ever creates `USER`-role
accounts — there is intentionally **no UI or API to self-promote to ADMIN**, as
that would be a security hole. To test admin-only features (add / edit / delete /
restock) locally, register a normal user through the app, then flip that user's
role directly in the database:

**Option A — Prisma Studio (GUI):**

```bash
cd backend
npx prisma studio          # opens http://localhost:5555
# Open the `User` table → find your user → set `role` to ADMIN → Save.
```

**Option B — one-line SQL (sqlite3):**

```bash
# from the backend/ directory
sqlite3 prisma/dev.db "UPDATE User SET role='ADMIN' WHERE email='you@example.com';"
```

The role is read from the database at login time and encoded into the JWT, so
**log out and log back in** after promoting for the new role to take effect.

### Frontend

```bash
cd frontend
npm install
npm run dev       # Vite dev server (default http://localhost:5173)
npm run build     # production build into dist/
```

## Screenshots

_TODO: add screenshots of the dashboard, StockGauge states, and search._

## Test report

_TODO: paste the latest `npm test` / coverage summary here._

## My AI Usage

_TODO: describe how AI tools were used on this project. See `PROMPTS.md` for the
full chronological prompt log._
