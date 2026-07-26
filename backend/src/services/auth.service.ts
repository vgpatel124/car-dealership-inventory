// Auth service — business logic layer for authentication.

import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { signToken } from '../utils/jwt';

// Domain error that carries an HTTP status so the controller can map it
// directly instead of guessing from the message.
export class AuthError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

const SALT_ROUNDS = 10;

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

/**
 * TODO(registerUser): Create a new user account.
 *  1. Validate that `email` and `password` are present (controller may also do
 *     basic validation and return 400).
 *  2. Hash the password with bcryptjs (e.g. `bcrypt.hash(password, 10)`).
 *     NEVER store the plaintext password.
 *  3. Insert the user via prisma.user.create with role defaulting to USER.
 *  4. If the email already exists, Prisma throws P2002 (unique constraint) —
 *     catch it and throw/return a 409 "Email already registered".
 *  5. Sign a JWT with { userId, role } via utils/jwt.signToken.
 *  6. Return { token, user } where `user` is a PublicUser (strip passwordHash).
 */
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const email = input?.email?.trim();
  const password = input?.password;

  if (!email || !password) {
    throw new AuthError(400, 'Email and password are required');
  }

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await prisma.user.create({
      data: { email, passwordHash },
    });
  } catch (err) {
    // P2002 = unique constraint violation (email already registered).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AuthError(409, 'Email already registered');
    }
    throw err;
  }

  const token = signToken({ userId: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
}

/**
 * TODO(loginUser): Authenticate an existing user.
 *  1. Look up the user by email via prisma.user.findUnique.
 *  2. If not found, throw a 401 "Invalid credentials" (do NOT reveal whether
 *     the email exists).
 *  3. Compare `password` to the stored hash with bcrypt.compare.
 *  4. On mismatch, throw the same 401 "Invalid credentials".
 *  5. On success, sign a JWT with { userId, role } and return
 *     { token, user } with a PublicUser (no passwordHash).
 */
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const email = input?.email?.trim();
  const password = input?.password;

  if (!email || !password) {
    throw new AuthError(400, 'Email and password are required');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Use the same 401 for "no such user" and "wrong password" so we never leak
  // which emails are registered. Still run a compare on a dummy hash when the
  // user is missing to avoid a timing side-channel.
  const dummyHash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8DvXWQNoO2xU0S1z6nZ9aQm9wV9m3G';
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);

  if (!user || !passwordMatches) {
    throw new AuthError(401, 'Invalid credentials');
  }

  const token = signToken({ userId: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
}
