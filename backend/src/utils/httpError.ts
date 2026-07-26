import { Response } from 'express';

// Base class for domain errors that carry an HTTP status code, so controllers
// can translate a thrown error into a response without parsing its message.
// AuthError and VehicleError extend this, letting one handler cover both.
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    // Resolves to the concrete subclass name (AuthError / VehicleError).
    this.name = new.target.name;
  }
}

// Single place that turns a caught error into an HTTP response: a known
// HttpError becomes its status + message; anything else is logged and 500s.
export function sendError(res: Response, err: unknown, logLabel: string): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  // eslint-disable-next-line no-console
  console.error(logLabel, err);
  res.status(500).json({ message: 'Internal server error' });
}
