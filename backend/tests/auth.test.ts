import request from 'supertest';
import app from '../src/app';

// RED tests for POST /api/auth/register.
//
// These describe the behaviour we WANT before it exists. Right now the
// controller returns 501, so every assertion below fails on purpose — that is
// the "Red" step of TDD. Implementing registerUser + wiring the controller
// will turn these green.

describe('POST /api/auth/register', () => {
  const uniqueEmail = () => `user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

  it('registers a new user and returns 201 with a token and a user (no passwordHash)', async () => {
    const email = uniqueEmail();

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'sup3r-secret' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');

    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({ email, role: 'USER' });
    expect(res.body.user).toHaveProperty('id');

    // The password hash must NEVER be exposed to clients.
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 409 when the email is already registered', async () => {
    const email = uniqueEmail();
    const payload = { email, password: 'sup3r-secret' };

    // First registration should succeed.
    const first = await request(app).post('/api/auth/register').send(payload);
    expect(first.status).toBe(201);

    // Duplicate registration should conflict.
    const second = await request(app).post('/api/auth/register').send(payload);
    expect(second.status).toBe(409);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'sup3r-secret' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: uniqueEmail() });

    expect(res.status).toBe(400);
  });
});
