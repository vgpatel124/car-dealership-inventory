import request from 'supertest';
import type { Application } from 'express';

// Shared auth setup for tests that need a logged-in caller. Rather than poking
// at the auth service internals, this drives the REAL /api/auth endpoints so the
// token we hand back is exactly what a client would receive in production.

let counter = 0;

/** A guaranteed-unique email so parallel/repeat runs never collide. */
export function uniqueEmail(): string {
  counter += 1;
  return `vehicle_test_${Date.now()}_${counter}_${Math.random().toString(36).slice(2)}@example.com`;
}

export interface AuthContext {
  token: string;
  user: { id: string; email: string; role: 'USER' | 'ADMIN' };
}

/**
 * Registers a brand-new user via POST /api/auth/register and returns a valid
 * JWT (plus the created user). Keeps vehicle tests from re-implementing auth.
 */
export async function registerAndGetToken(app: Application): Promise<AuthContext> {
  const email = uniqueEmail();

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'sup3r-secret' });

  if (res.status !== 201 || !res.body?.token) {
    throw new Error(
      `Test setup failed: could not register user (status ${res.status}): ${JSON.stringify(
        res.body,
      )}`,
    );
  }

  return { token: res.body.token as string, user: res.body.user };
}

/** Formats a bearer Authorization header value for a given token. */
export function bearer(token: string): string {
  return `Bearer ${token}`;
}
