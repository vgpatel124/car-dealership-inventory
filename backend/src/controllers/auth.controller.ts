import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';
import { sendError } from '../utils/httpError';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body ?? {};
    const result = await registerUser({ email, password });
    res.status(201).json(result);
  } catch (err) {
    sendError(res, err, 'Unexpected auth error:');
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body ?? {};
    const result = await loginUser({ email, password });
    res.status(200).json(result);
  } catch (err) {
    sendError(res, err, 'Unexpected auth error:');
  }
}
