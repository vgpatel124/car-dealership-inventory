// Runs once per test file, BEFORE the test module (and thus before src/app,
// src/utils/prisma, etc.) is imported. Loading .env.test here with `override`
// guarantees PrismaClient reads DATABASE_URL=test.db instead of the dev .env
// that Prisma would otherwise auto-load — so tests never write to dev.db.
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '.env.test'),
  override: true,
});
