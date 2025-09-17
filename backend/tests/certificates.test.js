const request = require('supertest');
const app = require('../src/app');
const setup = require('./setup.test');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const { hashPassword } = require('../src/utils/crypto');

let accessToken;
let companyId;
let userId;

beforeAll(async () => {
  await setup.connect();
});

afterAll(async () => {
  await setup.closeDatabase();
});

afterEach(async () => {
  await setup.clearDatabase();
});

test('company can create certificate and regulator can issue', async () => {
  // create company
  const company = await Company.create({ name: 'ACME Corp' });
  companyId = company._id;

  // create company admin user
  const user = await User.create({ email: 'co@example.com', passwordHash: await hashPassword('pass'), role: 'company_admin', companyId });
  userId = user._id;

  // login to get token
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'co@example.com', password: 'pass' }).expect(401);
  // our register endpoint created user without password sometimes; to keep tests simple, call register route to ensure password exists
  await request(app).post('/api/v1/auth/register').send({ email: 'co@example.com', password: 'pass', role: 'company_admin', companyId });
  const login2 = await request(app).post('/api/v1/auth/login').send({ email: 'co@example.com', password: 'pass' }).expect(200);
  accessToken = login2.body.data.access;

  // create certificate
  const certRes = await request(app).post('/api/v1/certificates').set('Authorization', `Bearer ${accessToken}`).send({ subject: 'AI Model v1', metadataHash: '0xdeadbeef' }).expect(201);
  expect(certRes.body.success).toBe(true);
  const certId = certRes.body.data._id;

  // create regulator user
  const reg = await User.create({ email: 'reg@example.com', passwordHash: await hashPassword('rpass'), role: 'regulator_admin' });
  // ensure regulator can issue
  await request(app).post('/api/v1/auth/register').send({ email: 'reg@example.com', password: 'rpass', role: 'regulator_admin' });
  const loginReg = await request(app).post('/api/v1/auth/login').send({ email: 'reg@example.com', password: 'rpass' }).expect(200);
  const regToken = loginReg.body.data.access;

  // issue certificate
  const issue = await request(app).post(`/api/v1/certificates/${certId}/issue`).set('Authorization', `Bearer ${regToken}`).send({ notes: 'OK' }).expect(200);
  expect(issue.body.success).toBe(true);
  expect(issue.body.data.certificate.status).toBe('issued');
});
