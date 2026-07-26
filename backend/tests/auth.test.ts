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

  // A present-but-empty string is a distinct case from a missing key: the value
  // exists on the body but is falsy, so validation must still reject it.
  it('returns 400 when email is an empty string (not just missing)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: '', password: 'sup3r-secret' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is an empty string (not just missing)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: uniqueEmail(), password: '' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  const uniqueEmail = () => `login_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

  // Registers a fresh user so login can be exercised against a KNOWN-good email
  // (the "correct email" half of the wrong-password case below).
  async function registerFreshUser(password = 'sup3r-secret') {
    const email = uniqueEmail();
    const res = await request(app).post('/api/auth/register').send({ email, password });
    expect(res.status).toBe(201);
    return { email, password };
  }

  it('logs in with correct credentials and returns 200 with a token', async () => {
    const { email, password } = await registerFreshUser();

    const res = await request(app).post('/api/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ email, role: 'USER' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 (NOT 404) for a correct email with the wrong password', async () => {
    const { email } = await registerFreshUser('the-right-password');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'the-wrong-password' });

    // Must be 401: a 404 here would leak that the email is registered.
    expect(res.status).toBe(401);
    expect(res.status).not.toBe(404);
  });

  it('returns the same 401 for an unknown email (does not leak account existence)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail(), password: 'whatever' });

    expect(res.status).toBe(401);
  });
});
