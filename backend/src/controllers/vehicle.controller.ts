import { Request, Response } from 'express';

// All handlers are stubbed to 501 Not Implemented (Red state for TDD). Each
// points at the matching service TODO in src/services/vehicle.service.ts.

export async function createVehicle(_req: Request, res: Response): Promise<void> {
  res.status(501).json({
    message: 'Not implemented. See TODO(createVehicle) in src/services/vehicle.service.ts',
  });
}

export async function listVehicles(_req: Request, res: Response): Promise<void> {
  res.status(501).json({
    message: 'Not implemented. See TODO(listVehicles) in src/services/vehicle.service.ts',
  });
}

export async function searchVehicles(_req: Request, res: Response): Promise<void> {
  res.status(501).json({
    message: 'Not implemented. See TODO(searchVehicles) in src/services/vehicle.service.ts',
  });
}

export async function updateVehicle(_req: Request, res: Response): Promise<void> {
  res.status(501).json({
    message: 'Not implemented. See TODO(updateVehicle) in src/services/vehicle.service.ts',
  });
}

export async function deleteVehicle(_req: Request, res: Response): Promise<void> {
  res.status(501).json({
    message: 'Not implemented. See TODO(deleteVehicle) in src/services/vehicle.service.ts',
  });
}

export async function purchaseVehicle(_req: Request, res: Response): Promise<void> {
  res.status(501).json({
    message: 'Not implemented. See TODO(purchaseVehicle) in src/services/vehicle.service.ts',
  });
}

export async function restockVehicle(_req: Request, res: Response): Promise<void> {
  res.status(501).json({
    message: 'Not implemented. See TODO(restockVehicle) in src/services/vehicle.service.ts',
  });
}
