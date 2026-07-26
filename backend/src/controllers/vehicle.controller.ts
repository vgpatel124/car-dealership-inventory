import { Request, Response } from 'express';
import {
  createVehicle as createVehicleService,
  listVehicles as listVehiclesService,
  searchVehicles as searchVehiclesService,
  updateVehicle as updateVehicleService,
  deleteVehicle as deleteVehicleService,
  purchaseVehicle as purchaseVehicleService,
  restockVehicle as restockVehicleService,
  VehicleInput,
  VehicleSearchFilters,
} from '../services/vehicle.service';
import { sendError } from '../utils/httpError';

const VEHICLE_ERROR_LABEL = 'Unexpected vehicle error:';

export async function createVehicle(req: Request, res: Response): Promise<void> {
  try {
    const { make, model, category, price, quantity } = req.body ?? {};
    const vehicle = await createVehicleService({ make, model, category, price, quantity });
    res.status(201).json(vehicle);
  } catch (err) {
    sendError(res, err, VEHICLE_ERROR_LABEL);
  }
}

export async function listVehicles(_req: Request, res: Response): Promise<void> {
  try {
    const vehicles = await listVehiclesService();
    res.status(200).json(vehicles);
  } catch (err) {
    sendError(res, err, VEHICLE_ERROR_LABEL);
  }
}

export async function searchVehicles(req: Request, res: Response): Promise<void> {
  try {
    const filters = parseSearchFilters(req.query);
    const vehicles = await searchVehiclesService(filters);
    res.status(200).json(vehicles);
  } catch (err) {
    sendError(res, err, VEHICLE_ERROR_LABEL);
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

export async function updateVehicle(req: Request, res: Response): Promise<void> {
  try {
    const { make, model, category, price, quantity } = req.body ?? {};
    const patch: Partial<VehicleInput> = { make, model, category, price, quantity };
    // Drop keys the caller didn't send so this stays a genuine partial update.
    (Object.keys(patch) as (keyof VehicleInput)[]).forEach((key) => {
      if (patch[key] === undefined) delete patch[key];
    });

    const vehicle = await updateVehicleService(req.params.id, patch);
    res.status(200).json(vehicle);
  } catch (err) {
    sendError(res, err, VEHICLE_ERROR_LABEL);
  }
}

export async function deleteVehicle(req: Request, res: Response): Promise<void> {
  try {
    await deleteVehicleService(req.params.id);
    res.status(204).send();
  } catch (err) {
    sendError(res, err, VEHICLE_ERROR_LABEL);
  }
}

export async function purchaseVehicle(req: Request, res: Response): Promise<void> {
  try {
    const vehicle = await purchaseVehicleService(req.params.id);
    res.status(200).json(vehicle);
  } catch (err) {
    sendError(res, err, VEHICLE_ERROR_LABEL);
  }
}

export async function restockVehicle(req: Request, res: Response): Promise<void> {
  try {
    const rawQty = (req.body ?? {}).qty;
    const qty = rawQty === undefined ? 1 : Number(rawQty);
    const vehicle = await restockVehicleService(req.params.id, qty);
    res.status(200).json(vehicle);
  } catch (err) {
    sendError(res, err, VEHICLE_ERROR_LABEL);
  }
}
