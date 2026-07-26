import request from 'supertest';
import app from '../src/app';
import prisma from '../src/utils/prisma';
import { registerAndGetToken, registerAdminAndGetToken, bearer } from './helpers/auth';

// RED tests for the vehicle catalog endpoints (create / list / search).
//
// They describe the behaviour we WANT before the service layer exists. The
// controllers currently return 501, so these assertions fail on purpose — the
// "Red" step of TDD. Implementing listVehicles/createVehicle/searchVehicles and
// wiring the controller turns them green.

// The dev SQLite file persists across runs, so every test tags its data with a
// unique string. Filters then only ever match rows this run created, keeping
// counts/empty-set assertions deterministic regardless of leftover data.
const tag = () => `t${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

describe('Vehicle API', () => {
  let token: string;
  let adminToken: string;

  beforeAll(async () => {
    ({ token } = await registerAndGetToken(app));
    ({ token: adminToken } = await registerAdminAndGetToken(app));
  });

  // Creates a vehicle through the real endpoint and returns the created record.
  // Defaults to the ADMIN caller so it works for admin-only flows too.
  const createVehicle = async (
    overrides: Partial<{ make: string; model: string; category: string; price: number; quantity: number }> = {},
    callerToken: string = adminToken,
  ) => {
    const payload = {
      make: `Make${tag()}`,
      model: `Model${tag()}`,
      category: 'Sedan',
      price: 20000,
      quantity: 5,
      ...overrides,
    };
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', bearer(callerToken))
      .send(payload);
    expect(res.status).toBe(201);
    return res.body as { id: string; quantity: number; price: number; [k: string]: unknown };
  };

  // A syntactically valid UUID that should never exist in the DB.
  const MISSING_ID = '00000000-0000-0000-0000-000000000000';

  describe('POST /api/vehicles', () => {
    it('requires authentication (401 without a token)', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .send({ make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 3 });

      expect(res.status).toBe(401);
    });

    it('creates a vehicle and returns 201 with the created record', async () => {
      const payload = {
        make: `Toyota${tag()}`,
        model: `Corolla${tag()}`,
        category: 'Sedan',
        price: 20000,
        quantity: 3,
      };

      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', bearer(token))
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toMatchObject({
        make: payload.make,
        model: payload.model,
        category: payload.category,
        price: payload.price,
        quantity: payload.quantity,
      });
    });

    it('defaults quantity to 0 when omitted (persisted in the DB, not just echoed)', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', bearer(token))
        .send({ make: `Honda${tag()}`, model: `Civic${tag()}`, category: 'Sedan', price: 22000 });

      expect(res.status).toBe(201);
      expect(res.body.quantity).toBe(0);

      // Independently confirm the value was actually persisted — re-read the row
      // straight from the database rather than trusting the response body.
      const persisted = await prisma.vehicle.findUnique({ where: { id: res.body.id } });
      expect(persisted).not.toBeNull();
      expect(persisted?.quantity).toBe(0);
    });

    it('returns 400 when price is negative', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', bearer(token))
        .send({ make: 'Toyota', model: 'Corolla', category: 'Sedan', price: -1, quantity: 3 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when quantity is negative', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', bearer(token))
        .send({ make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: -5 });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/vehicles', () => {
    it('requires authentication (401 without a token)', async () => {
      const res = await request(app).get('/api/vehicles');
      expect(res.status).toBe(401);
    });

    it('returns all vehicles, including newly created ones', async () => {
      const marker = tag();
      const created = await request(app)
        .post('/api/vehicles')
        .set('Authorization', bearer(token))
        .send({ make: `Ford${marker}`, model: `F150${marker}`, category: 'Truck', price: 40000, quantity: 2 });
      expect(created.status).toBe(201);

      const res = await request(app).get('/api/vehicles').set('Authorization', bearer(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const ids = res.body.map((v: { id: string }) => v.id);
      expect(ids).toContain(created.body.id);
    });
  });

  describe('GET /api/vehicles/search', () => {
    // A single unique tag shared by this block's seed data so filters below only
    // ever match these four rows.
    const t = tag();
    const auth = () => bearer(token);

    beforeAll(async () => {
      const seed = [
        { make: `Toyota${t}`, model: `Corolla${t}`, category: `Sedan${t}`, price: 20000, quantity: 5 },
        { make: `Toyota${t}`, model: `Camry${t}`, category: `Sedan${t}`, price: 30000, quantity: 3 },
        { make: `Honda${t}`, model: `Civic${t}`, category: `Sedan${t}`, price: 22000, quantity: 4 },
        { make: `Ford${t}`, model: `F150${t}`, category: `Truck${t}`, price: 40000, quantity: 2 },
      ];

      for (const v of seed) {
        const res = await request(app).post('/api/vehicles').set('Authorization', auth()).send(v);
        expect(res.status).toBe(201);
      }
    });

    it('requires authentication (401 without a token)', async () => {
      const res = await request(app).get('/api/vehicles/search');
      expect(res.status).toBe(401);
    });

    it('filters by make with a case-insensitive partial match', async () => {
      // Stored as "Toyota<t>"; we search an UPPERCASE partial ("OYOTA<t>") to
      // prove both case-insensitivity and substring matching.
      const res = await request(app)
        .get('/api/vehicles/search')
        .query({ make: `OYOTA${t}` })
        .set('Authorization', auth());

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      const models = res.body.map((v: { model: string }) => v.model).sort();
      expect(models).toEqual([`Camry${t}`, `Corolla${t}`].sort());
    });

    it('filters by a price range (minPrice/maxPrice)', async () => {
      const res = await request(app)
        .get('/api/vehicles/search')
        .query({ category: `Sedan${t}`, minPrice: 21000, maxPrice: 31000 })
        .set('Authorization', auth());

      expect(res.status).toBe(200);
      // Sedan<t> priced in [21000, 31000]: Camry (30000) and Civic (22000).
      const models = res.body.map((v: { model: string }) => v.model).sort();
      expect(models).toEqual([`Camry${t}`, `Civic${t}`].sort());
    });

    it('combines two filters (make + minPrice)', async () => {
      const res = await request(app)
        .get('/api/vehicles/search')
        .query({ make: `toyota${t}`, minPrice: 25000 })
        .set('Authorization', auth());

      expect(res.status).toBe(200);
      // Only the Toyota over 25000 is the Camry (30000); Corolla (20000) drops.
      expect(res.body).toHaveLength(1);
      expect(res.body[0].model).toBe(`Camry${t}`);
    });

    it('returns an empty array when nothing matches', async () => {
      const res = await request(app)
        .get('/api/vehicles/search')
        .query({ make: `nonexistent${t}` })
        .set('Authorization', auth());

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('requires authentication (401 without a token)', async () => {
      const res = await request(app).put(`/api/vehicles/${MISSING_ID}`).send({ price: 1 });
      expect(res.status).toBe(401);
    });

    it('updates fields and returns 200 with the updated vehicle', async () => {
      const vehicle = await createVehicle({ price: 20000, quantity: 5 });

      const res = await request(app)
        .put(`/api/vehicles/${vehicle.id}`)
        .set('Authorization', bearer(token))
        .send({ price: 25999, quantity: 9, category: 'Coupe' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: vehicle.id,
        price: 25999,
        quantity: 9,
        category: 'Coupe',
      });
    });

    it('returns 404 when the vehicle does not exist', async () => {
      const res = await request(app)
        .put(`/api/vehicles/${MISSING_ID}`)
        .set('Authorization', bearer(token))
        .send({ price: 12345 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('requires authentication (401 without a token)', async () => {
      const res = await request(app).delete(`/api/vehicles/${MISSING_ID}`);
      expect(res.status).toBe(401);
    });

    it('forbids a USER caller (403)', async () => {
      const vehicle = await createVehicle();

      const res = await request(app)
        .delete(`/api/vehicles/${vehicle.id}`)
        .set('Authorization', bearer(token));

      expect(res.status).toBe(403);
    });

    it('lets an ADMIN delete a vehicle (200/204)', async () => {
      const vehicle = await createVehicle();

      const res = await request(app)
        .delete(`/api/vehicles/${vehicle.id}`)
        .set('Authorization', bearer(adminToken));

      expect([200, 204]).toContain(res.status);

      // The row should really be gone.
      const persisted = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(persisted).toBeNull();
    });

    it('returns 404 when an ADMIN deletes a non-existent vehicle', async () => {
      const res = await request(app)
        .delete(`/api/vehicles/${MISSING_ID}`)
        .set('Authorization', bearer(adminToken));

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/vehicles/:id/purchase', () => {
    it('requires authentication (401 without a token)', async () => {
      const res = await request(app).post(`/api/vehicles/${MISSING_ID}/purchase`);
      expect(res.status).toBe(401);
    });

    it('decrements quantity by exactly 1 and returns 200', async () => {
      const vehicle = await createVehicle({ quantity: 3 });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle.id}/purchase`)
        .set('Authorization', bearer(token));

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(2);

      // Confirm the decrement was persisted, not just echoed.
      const persisted = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(persisted?.quantity).toBe(2);
    });

    it('returns 409 when quantity is already 0', async () => {
      const vehicle = await createVehicle({ quantity: 0 });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle.id}/purchase`)
        .set('Authorization', bearer(token));

      expect(res.status).toBe(409);
    });

    it('handles two concurrent purchases of the last unit: exactly one 200 and one 409', async () => {
      const vehicle = await createVehicle({ quantity: 1 });

      // Fire both at once (Promise.all, NOT sequential awaits) so they race on
      // the same last unit. The atomic guarded updateMany must let exactly one
      // win and force the other to 409 — no overselling.
      const [a, b] = await Promise.all([
        request(app).post(`/api/vehicles/${vehicle.id}/purchase`).set('Authorization', bearer(token)),
        request(app).post(`/api/vehicles/${vehicle.id}/purchase`).set('Authorization', bearer(token)),
      ]);

      const statuses = [a.status, b.status].sort();
      expect(statuses).toEqual([200, 409]);

      // Stock must never go negative — the loser did not oversell.
      const persisted = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(persisted?.quantity).toBe(0);
    });
  });

  describe('POST /api/vehicles/:id/restock', () => {
    it('requires authentication (401 without a token)', async () => {
      const res = await request(app).post(`/api/vehicles/${MISSING_ID}/restock`).send({ qty: 5 });
      expect(res.status).toBe(401);
    });

    it('forbids a USER caller (403)', async () => {
      const vehicle = await createVehicle({ quantity: 2 });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle.id}/restock`)
        .set('Authorization', bearer(token))
        .send({ qty: 5 });

      expect(res.status).toBe(403);
    });

    it('lets an ADMIN increment quantity by the given amount (200)', async () => {
      const vehicle = await createVehicle({ quantity: 2 });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle.id}/restock`)
        .set('Authorization', bearer(adminToken))
        .send({ qty: 5 });

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(7);

      const persisted = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
      expect(persisted?.quantity).toBe(7);
    });
  });
});
