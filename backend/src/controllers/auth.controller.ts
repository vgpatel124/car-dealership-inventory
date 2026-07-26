import { Request, Response } from 'express';
import { AuthError, registerUser, loginUser } from '../services/auth.service';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body ?? {};
    const result = await registerUser({ email, password });
    res.status(201).json(result);
  } catch (err) {
    handleAuthError(err, res);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body ?? {};
    const result = await loginUser({ email, password });
    res.status(200).json(result);
  } catch (err) {
    handleAuthError(err, res);
  }
}

// Maps AuthError -> its carried status code (400/401/409); anything else is an
// unexpected 500.
function handleAuthError(err: unknown, res: Response): void {
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  // eslint-disable-next-line no-console
  console.error('Unexpected auth error:', err);
  res.status(500).json({ message: 'Internal server error' });
}
