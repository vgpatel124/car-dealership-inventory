// One-off maintenance script: removes test garbage that leaked into dev.db
// before the test suite was isolated to test.db.
//
// Deletes:
//   - Vehicles whose make starts with "Maket" (test helper) or "ProxyMake"
//     (manual curl proxy check).
//   - Users with example.com-style emails (all test accounts).
//
// Safe by design: it explicitly loads the dev .env and refuses to run unless
// DATABASE_URL points at dev.db, so it can never wipe test.db or another DB.
//
// Run from backend/:  node scripts/clean-dev-db.js
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const url = process.env.DATABASE_URL || '';
if (!url.includes('dev.db')) {
  console.error(`Refusing to run: DATABASE_URL is "${url}", expected it to point at dev.db.`);
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const before = {
    vehicles: await prisma.vehicle.count(),
    users: await prisma.user.count(),
  };

  const deletedVehicles = await prisma.vehicle.deleteMany({
    where: {
      OR: [
        { make: { startsWith: 'Maket' } },
        { make: { startsWith: 'ProxyMake' } },
        // Search-seed test rows (make is a real name + a random test tag).
        { make: { startsWith: 'Toyotat' } },
        { make: { startsWith: 'Hondat' } },
        { make: { startsWith: 'Fordt' } },
      ],
    },
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { endsWith: '@example.com' } },
  });

  const after = {
    vehicles: await prisma.vehicle.count(),
    users: await prisma.user.count(),
  };

  // Surface other clearly test-tagged rows NOT covered by the requested criteria
  // so a human can decide whether to remove them too.
  const remaining = await prisma.vehicle.findMany({
    where: {
      OR: [
        { make: { startsWith: 'Toyotat' } },
        { make: { startsWith: 'Hondat' } },
        { make: { startsWith: 'Fordt' } },
      ],
    },
    select: { make: true },
  });

  console.log('dev.db cleanup complete');
  console.log('  before :', before);
  console.log('  deleted:', { vehicles: deletedVehicles.count, users: deletedUsers.count });
  console.log('  after  :', after);
  console.log(`  NOTE: ${remaining.length} other test-tagged vehicles remain (Toyotat*/Hondat*/Fordt*).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
