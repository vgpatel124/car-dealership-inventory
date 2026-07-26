import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import vehicleRoutes from './routes/vehicle.routes';

// Build and export the Express app WITHOUT starting a listener, so tests can
// import it directly and drive it with Supertest.
export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/vehicles', vehicleRoutes);

  // Fallback 404 for unknown routes.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: 'Not found' });
  });

  return app;
}

const app = createApp();
export default app;
