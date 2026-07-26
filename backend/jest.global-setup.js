// Runs once before the whole suite. Points at the test database and ensures its
// schema exists — creating test.db fresh from the committed migrations if it's
// missing — so tests have real tables without ever touching dev.db.
const path = require('path');
const { execSync } = require('child_process');

module.exports = async () => {
  require('dotenv').config({
    path: path.resolve(__dirname, '.env.test'),
    override: true,
  });

  // `migrate deploy` applies existing migrations to the DATABASE_URL we just set
  // (test.db). Env vars already in process.env take precedence over Prisma's own
  // .env loading, so this targets test.db, not dev.db.
  execSync('npx prisma migrate deploy', {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env,
  });
};
