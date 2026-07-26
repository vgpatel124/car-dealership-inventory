import request from 'supertest';
import app from '../src/app';
import prisma from '../src/utils/prisma';
import { registerAndGetToken, bearer } from './helpers/auth';

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

  beforeAll(async () => {
    ({ token } = await registerAndGetToken(app));
  });

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
});
