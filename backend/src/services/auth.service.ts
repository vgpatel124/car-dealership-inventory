// Auth service — business logic layer for authentication.

import bcrypt from 'bcryptjs';
import { Prisma, User } from '@prisma/client';
import prisma from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { HttpError } from '../utils/httpError';

// Domain error that carries an HTTP status so the controller can map it
// directly instead of guessing from the message.
export class AuthError extends HttpError {}

const SALT_ROUNDS = 10;

// Prisma's unique-constraint violation code (a duplicate email on register).
const PRISMA_UNIQUE_VIOLATION = 'P2002';

// A valid bcrypt hash to compare against when the email is unknown, so login
// takes the same time whether or not the account exists (no timing side-channel).
const DUMMY_BCRYPT_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8DvXWQNoO2xU0S1z6nZ9aQm9wV9m3G';

// Single source of truth for password hashing. registerUser and the Prisma seed
// script both call this so every stored hash uses bcryptjs with the same cost
// factor — never duplicate a different hashing approach elsewhere.
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// A user object safe to return to clients — never includes passwordHash.
export interface PublicUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

// Trims and validates raw credentials once for both register and login,
// narrowing them to non-empty strings so there's a single 400 path.
function requireCredentials(
  rawEmail?: string,
  rawPassword?: string,
): { email: string; password: string } {
  const email = rawEmail?.trim();
  const password = rawPassword;
  if (!email || !password) {
    throw new AuthError(400, 'Email and password are required');
  }
  return { email, password };
}

// Client-safe projection of a User row — never exposes passwordHash.
function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
}

/**
 * Creates a new user account, hashing the password and returning a JWT plus the
 * public user. Throws AuthError(409) when the email is already registered.
 */
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const { email, password } = requireCredentials(input?.email, input?.password);
  const passwordHash = await hashPassword(password);

  let user: User;
  try {
    user = await prisma.user.create({ data: { email, passwordHash } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === PRISMA_UNIQUE_VIOLATION) {
      throw new AuthError(409, 'Email already registered');
    }
    throw err;
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: toPublicUser(user) };
}

/**
 * Authenticates a user. Returns the same 401 for an unknown email and a wrong
 * password so callers can't probe which emails are registered.
 */
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const { email, password } = requireCredentials(input?.email, input?.password);

  const user = await prisma.user.findUnique({ where: { email } });
  // Always run a compare (against a dummy hash when the user is missing) so
  // response time doesn't leak account existence.
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_BCRYPT_HASH);

  if (!user || !passwordMatches) {
    throw new AuthError(401, 'Invalid credentials');
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: toPublicUser(user) };
}
