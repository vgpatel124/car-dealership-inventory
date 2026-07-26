import jwt, { SignOptions } from 'jsonwebtoken';

// The shape of the data we embed in every JWT. Keep this small: just enough to
// authorize a request without another DB round-trip.
export interface JwtPayload {
  userId: string;
  role: 'USER' | 'ADMIN';
}

// Token lifetime used when JWT_EXPIRES_IN isn't configured via env.
const DEFAULT_JWT_EXPIRES_IN = '1d';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add it to your .env file.');
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? DEFAULT_JWT_EXPIRES_IN) as SignOptions['expiresIn'];
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getSecret());
  // `verify` returns string | JwtPayload; we always sign an object payload.
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }
  const { userId, role } = decoded as Partial<JwtPayload>;
  if (!userId || !role) {
    throw new Error('Invalid token payload');
  }
  return { userId, role };
}
