// Vehicle service — business logic layer for the inventory catalog.
//
// listVehicles / createVehicle / searchVehicles are implemented below. The
// remaining functions are still TDD targets and throw until implemented.

import { Prisma, Vehicle } from '@prisma/client';
import prisma from '../utils/prisma';

// Domain error that carries an HTTP status so the controller can map it
// directly instead of guessing from the message (mirrors AuthError).
export class VehicleError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'VehicleError';
  }
}

export interface VehicleInput {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity?: number;
}

export interface VehicleSearchFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * TODO(listVehicles): Return all vehicles.
 *  - prisma.vehicle.findMany(), ideally ordered by createdAt desc.
 *  - Consider pagination later; for now return the full list.
 */
export async function listVehicles(): Promise<Vehicle[]> {
  return prisma.vehicle.findMany({ orderBy: { createdAt: 'desc' } });
}

/**
 * TODO(createVehicle): Create a new vehicle.
 *  1. Validate required fields (make, model, category, price). Negative price
 *     or quantity should be rejected (controller returns 400).
 *  2. prisma.vehicle.create with quantity defaulting to 0 when omitted.
 *  3. Return the created vehicle.
 */
export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const make = input?.make?.trim();
  const model = input?.model?.trim();
  const category = input?.category?.trim();
  const { price } = input ?? {};
  // The service owns input defaulting/validation (same as price below), so we
  // set quantity here rather than relying on the schema's @default(0).
  const quantity = input?.quantity ?? 0;

  if (!make || !model || !category || price === undefined || price === null) {
    throw new VehicleError(400, 'make, model, category and price are required');
  }
  if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
    throw new VehicleError(400, 'price must be a non-negative number');
  }
  if (typeof quantity !== 'number' || Number.isNaN(quantity) || quantity < 0) {
    throw new VehicleError(400, 'quantity must be a non-negative number');
  }

  return prisma.vehicle.create({
    data: { make, model, category, price, quantity },
  });
}

/**
 * TODO(searchVehicles): Filter vehicles by any combination of criteria.
 *  - All filters are optional and combinable (build a Prisma `where` object).
 *  - make/model/category: case-insensitive `contains` matches.
 *  - price range: gte minPrice and/or lte maxPrice when provided.
 *  - Relies on the make/model/category/price indexes in schema.prisma.
 */
export async function searchVehicles(filters: VehicleSearchFilters): Promise<Vehicle[]> {
  const where: Prisma.VehicleWhereInput = {};

  // On SQLite, Prisma's `contains` compiles to a `LIKE` which is already
  // case-insensitive for ASCII — so we deliberately omit `mode: 'insensitive'`
  // (that option is unsupported by the SQLite connector and would throw).
  if (filters.make) where.make = { contains: filters.make };
  if (filters.model) where.model = { contains: filters.model };
  if (filters.category) where.category = { contains: filters.category };

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const price: Prisma.FloatFilter = {};
    if (filters.minPrice !== undefined) price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) price.lte = filters.maxPrice;
    where.price = price;
  }

  return prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' } });
}

/**
 * TODO(updateVehicle): Update an existing vehicle by id.
 *  1. Validate the payload (partial update of make/model/category/price/qty).
 *  2. prisma.vehicle.update({ where: { id }, data }).
 *  3. If the id does not exist, Prisma throws P2025 — map to 404.
 *  4. Return the updated vehicle.
 */
export async function updateVehicle(_id: string, _input: Partial<VehicleInput>): Promise<unknown> {
  throw new Error('not implemented yet');
}

/**
 * TODO(deleteVehicle): Delete a vehicle by id (ADMIN only — enforced at route).
 *  1. prisma.vehicle.delete({ where: { id } }).
 *  2. If the id does not exist (P2025), map to 404.
 *  3. Return void / a success indicator.
 */
export async function deleteVehicle(_id: string): Promise<void> {
  throw new Error('not implemented yet');
}

/**
 * TODO(purchaseVehicle): Buy one (or `qty`) unit(s), decrementing stock.
 *  - MUST be atomic to avoid race conditions when two buyers hit the same
 *    vehicle concurrently. Do the decrement inside a transaction and guard the
 *    quantity, e.g.:
 *      prisma.vehicle.updateMany({
 *        where: { id, quantity: { gte: qty } },
 *        data: { quantity: { decrement: qty } },
 *      })
 *    then check the returned `count`: if 0, stock was insufficient → 409
 *    "Out of stock". This avoids the read-then-write race entirely.
 *  - Return the updated vehicle.
 */
export async function purchaseVehicle(_id: string, _qty = 1): Promise<unknown> {
  throw new Error('not implemented yet');
}

/**
 * TODO(restockVehicle): Add `qty` units to stock (ADMIN only — enforced at route).
 *  - Atomic increment to avoid lost updates under concurrency:
 *      prisma.vehicle.update({
 *        where: { id },
 *        data: { quantity: { increment: qty } },
 *      })
 *  - Validate qty > 0 (controller returns 400 otherwise).
 *  - Map missing id (P2025) to 404. Return the updated vehicle.
 */
export async function restockVehicle(_id: string, _qty = 1): Promise<unknown> {
  throw new Error('not implemented yet');
}
