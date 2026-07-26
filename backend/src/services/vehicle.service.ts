// Vehicle service — business logic layer for the inventory catalog
// (list / create / search / update / delete / purchase / restock).

import { Prisma, Vehicle } from '@prisma/client';
import prisma from '../utils/prisma';
import { HttpError } from '../utils/httpError';

// Prisma's "record to update/delete does not exist" code.
const PRISMA_RECORD_NOT_FOUND = 'P2025';

// Domain error that carries an HTTP status so the controller can map it
// directly instead of guessing from the message (mirrors AuthError).
export class VehicleError extends HttpError {}

// Rejects anything that isn't a finite, non-negative number with a 400 — shared
// by create and update for the price/quantity fields.
function assertNonNegativeNumber(value: number, field: string): void {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    throw new VehicleError(400, `${field} must be a non-negative number`);
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
  assertNonNegativeNumber(price, 'price');
  assertNonNegativeNumber(quantity, 'quantity');

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
export async function updateVehicle(id: string, input: Partial<VehicleInput>): Promise<Vehicle> {
  const data: Prisma.VehicleUpdateInput = {};

  if (input.make !== undefined) {
    const make = input.make?.trim();
    if (!make) throw new VehicleError(400, 'make must not be empty');
    data.make = make;
  }
  if (input.model !== undefined) {
    const model = input.model?.trim();
    if (!model) throw new VehicleError(400, 'model must not be empty');
    data.model = model;
  }
  if (input.category !== undefined) {
    const category = input.category?.trim();
    if (!category) throw new VehicleError(400, 'category must not be empty');
    data.category = category;
  }
  if (input.price !== undefined) {
    assertNonNegativeNumber(input.price, 'price');
    data.price = input.price;
  }
  if (input.quantity !== undefined) {
    assertNonNegativeNumber(input.quantity, 'quantity');
    data.quantity = input.quantity;
  }

  try {
    return await prisma.vehicle.update({ where: { id }, data });
  } catch (err) {
    throw mapNotFound(err);
  }
}

/**
 * TODO(deleteVehicle): Delete a vehicle by id (ADMIN only — enforced at route).
 *  1. prisma.vehicle.delete({ where: { id } }).
 *  2. If the id does not exist (P2025), map to 404.
 *  3. Return void / a success indicator.
 */
export async function deleteVehicle(id: string): Promise<void> {
  try {
    await prisma.vehicle.delete({ where: { id } });
  } catch (err) {
    throw mapNotFound(err);
  }
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
export async function purchaseVehicle(id: string, qty = 1): Promise<Vehicle> {
  // Atomic guarded decrement: a single updateMany that only touches the row when
  // stock is still available. Because the guard and the write are one statement,
  // concurrent buyers can't both pass a stale read — the DB serializes them, so
  // exactly one wins the last unit and the rest see count === 0. This is what
  // prevents overselling under the concurrent-request test.
  const { count } = await prisma.vehicle.updateMany({
    where: { id, quantity: { gt: 0 } },
    data: { quantity: { decrement: qty } },
  });

  if (count === 0) {
    // Either the vehicle is out of stock or it doesn't exist; a follow-up read
    // tells the two apart so we can return the right status.
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) throw new VehicleError(404, 'Vehicle not found');
    throw new VehicleError(409, 'Out of stock');
  }

  // Guaranteed to exist since the update above succeeded.
  return (await prisma.vehicle.findUnique({ where: { id } })) as Vehicle;
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
export async function restockVehicle(id: string, qty = 1): Promise<Vehicle> {
  if (typeof qty !== 'number' || Number.isNaN(qty) || qty <= 0) {
    throw new VehicleError(400, 'restock quantity must be a positive number');
  }

  try {
    return await prisma.vehicle.update({
      where: { id },
      data: { quantity: { increment: qty } },
    });
  } catch (err) {
    throw mapNotFound(err);
  }
}

// Translates Prisma's "record to update/delete not found" (P2025) into a 404
// VehicleError; anything else is re-thrown unchanged for the controller's 500.
function mapNotFound(err: unknown): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === PRISMA_RECORD_NOT_FOUND) {
    return new VehicleError(404, 'Vehicle not found');
  }
  return err;
}
