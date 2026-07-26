import { Request, Response } from 'express';
import {
  VehicleError,
  createVehicle as createVehicleService,
  listVehicles as listVehiclesService,
  searchVehicles as searchVehiclesService,
  VehicleSearchFilters,
} from '../services/vehicle.service';

// list / create / search are wired to the service layer. The remaining handlers
// are still stubbed to 501 (Red state for TDD) and point at their service TODO.

export async function createVehicle(req: Request, res: Response): Promise<void> {
  try {
    const { make, model, category, price, quantity } = req.body ?? {};
    const vehicle = await createVehicleService({ make, model, category, price, quantity });
    res.status(201).json(vehicle);
  } catch (err) {
    handleVehicleError(err, res);
  }
}

export async function listVehicles(_req: Request, res: Response): Promise<void> {
  try {
    const vehicles = await listVehiclesService();
    res.status(200).json(vehicles);
  } catch (err) {
    handleVehicleError(err, res);
  }
}

export async function searchVehicles(req: Request, res: Response): Promise<void> {
  try {
    const filters = parseSearchFilters(req.query);
    const vehicles = await searchVehiclesService(filters);
    res.status(200).json(vehicles);
  } catch (err) {
    handleVehicleError(err, res);
  }
}

// Query params arrive as strings; translate them into typed filters, ignoring
// blank/absent values and non-numeric price bounds.
function parseSearchFilters(query: Request['query']): VehicleSearchFilters {
  const filters: VehicleSearchFilters = {};

  const asText = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() !== '' ? value : undefined;

  const asNumber = (value: unknown): number | undefined => {
    if (typeof value !== 'string' || value.trim() === '') return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  };

  filters.make = asText(query.make);
  filters.model = asText(query.model);
  filters.category = asText(query.category);
  filters.minPrice = asNumber(query.minPrice);
  filters.maxPrice = asNumber(query.maxPrice);

  return filters;
}

// Maps VehicleError -> its carried status code (e.g. 400); anything else is an
// unexpected 500 (mirrors the auth controller's handler).
function handleVehicleError(err: unknown, res: Response): void {
  if (err instanceof VehicleError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  // eslint-disable-next-line no-console
  console.error('Unexpected vehicle error:', err);
  res.status(500).json({ message: 'Internal server error' });
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
