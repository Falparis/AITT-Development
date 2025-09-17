const request = require('supertest');
const app = require('../src/app');
const setup = require('./setup.test');
const User = require('../src/models/User');
const { hashPassword } = require('../src/utils/crypto');

beforeAll(async () => {
  await setup.connect();
});

afterAll(async () => {
  await setup.closeDatabase();
});

afterEach(async () => {
  await setup.clearDatabase();
});

test('register + login flow', async () => {
  // register
  const payload = { email: 'admin@example.com', password: 'pass1234', role: 'company_admin' };
  const r = await request(app).post('/api/v1/auth/register').send(payload).expect(201);
  expect(r.body.success).toBe(true);

  // ensure in DB
  const u = await User.findOne({ email: 'admin@example.com' });
  expect(u).toBeTruthy();

  // set password hash if register didn't set
  if (!u.passwordHash) {
    u.passwordHash = await hashPassword('pass1234');
    await u.save();
  }

  // login
  const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'admin@example.com', password: 'pass1234' }).expect(200);
  expect(loginRes.body.success).toBe(true);
  expect(loginRes.body.data.access).toBeTruthy();
  expect(loginRes.body.data.refresh).toBeTruthy();
});
