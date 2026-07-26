// Prisma seed script — populates dev.db with review-ready sample data.
//
// Run with `npx prisma db seed` (wired via the "prisma.seed" field in
// package.json), which loads .env and points at DATABASE_URL (dev.db locally).
//
// Idempotent by design: users are upserted on their unique email and vehicles
// are upserted on a stable, human-readable id, so running the seed repeatedly
// updates the same rows instead of creating duplicates or erroring out.

import { Role } from '@prisma/client';
import prisma from '../src/utils/prisma';
import { hashPassword } from '../src/services/auth.service';

// Passwords are hashed via the SAME helper registerUser uses (bcryptjs, cost 10)
// so seeded accounts log in exactly like registered ones. Plaintexts are
// documented here and in the README "Test accounts" section — local review only.
const SEED_USERS = [
  { email: 'admin@drivestock.test', password: 'Admin123!', role: Role.ADMIN },
  { email: 'user@drivestock.test', password: 'User123!', role: Role.USER },
];

// Stable ids make the upsert idempotent. Quantities are varied and include two
// sold-out vehicles (quantity 0) and a low-stock one (quantity 1) so the
// StockGauge's empty / low / healthy states are all visible immediately.
const SEED_VEHICLES = [
  { id: 'seed-camry', make: 'Toyota', model: 'Camry', category: 'Sedan', price: 26500, quantity: 8 },
  { id: 'seed-accord', make: 'Honda', model: 'Accord', category: 'Sedan', price: 28900, quantity: 3 },
  { id: 'seed-f150', make: 'Ford', model: 'F-150', category: 'Truck', price: 42000, quantity: 5 },
  { id: 'seed-ram1500', make: 'Ram', model: '1500', category: 'Truck', price: 39500, quantity: 0 },
  { id: 'seed-rav4', make: 'Toyota', model: 'RAV4', category: 'SUV', price: 31000, quantity: 6 },
  { id: 'seed-grandcherokee', make: 'Jeep', model: 'Grand Cherokee', category: 'SUV', price: 45000, quantity: 2 },
  { id: 'seed-mustang', make: 'Ford', model: 'Mustang', category: 'Coupe', price: 38000, quantity: 1 },
  { id: 'seed-m4', make: 'BMW', model: 'M4', category: 'Coupe', price: 74000, quantity: 0 },
];

async function seedUsers() {
  for (const { email, password, role } of SEED_USERS) {
    const passwordHash = await hashPassword(password);
    await prisma.user.upsert({
      where: { email },
      // Re-running resets the seed accounts to their documented state.
      update: { passwordHash, role },
      create: { email, passwordHash, role },
    });
    console.log(`  user  ${email} (${role})`);
  }
}

async function seedVehicles() {
  for (const v of SEED_VEHICLES) {
    await prisma.vehicle.upsert({
      where: { id: v.id },
      update: { make: v.make, model: v.model, category: v.category, price: v.price, quantity: v.quantity },
      create: v,
    });
    const stock = v.quantity === 0 ? 'SOLD OUT' : `qty ${v.quantity}`;
    console.log(`  vehicle  ${v.make} ${v.model} — ${v.category} — ${stock}`);
  }
}

async function main() {
  console.log('Seeding database…');
  await seedUsers();
  await seedVehicles();
  console.log(`Done: ${SEED_USERS.length} users, ${SEED_VEHICLES.length} vehicles.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
