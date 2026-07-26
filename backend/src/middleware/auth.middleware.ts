import { NextFunction, Request, Response } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

const BEARER_PREFIX = 'Bearer ';

// Augment Express's Request so downstream handlers can read `req.user` in a
// type-safe way after `authenticate` has run.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifies a `Bearer <token>` Authorization header. On success attaches the
 * decoded payload to `req.user`. Responds 401 if the header is missing or the
 * token is invalid/expired.
 *
 * This is reusable infrastructure — it is fully implemented (not a TDD target).
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    res.status(401).json({ message: 'Missing or malformed Authorization header' });
    return;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    res.status(401).json({ message: 'Missing bearer token' });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Must run after `authenticate`. Responds 403 unless the authenticated user has
 * the ADMIN role. Used to guard delete + restock.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Admin privileges required' });
    return;
  }
  next();
}
