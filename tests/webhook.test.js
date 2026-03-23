const request = require('supertest');

// Mock dependencies before requiring app
jest.mock('../src/config/database', () => ({
  authenticate: jest.fn().mockResolvedValue(),
  sync: jest.fn().mockResolvedValue(),
  define: jest.fn(),
}));

jest.mock('../src/queues/emailQueue', () => ({
  enqueueEmail: jest.fn().mockResolvedValue({ id: 'job-123' }),
  emailQueue: { process: jest.fn(), on: jest.fn() },
}));

jest.mock('../src/models/EmailLog', () => ({
  create: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../src/models/Offer', () => ({
  findAll: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(0),
  bulkCreate: jest.fn(),
}));

const EmailLog = require('../src/models/EmailLog');
const { enqueueEmail } = require('../src/queues/emailQueue');

// Minimal express app for testing (bypass DB startup)
const express = require('express');
const app = express();
app.use(express.json());
const webhookRoutes = require('../src/routes/webhook');
app.use('/webhook', webhookRoutes);

describe('POST /webhook/user-registered', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    EmailLog.create.mockResolvedValue({ id: 'log-uuid-1', update: jest.fn() });
    enqueueEmail.mockResolvedValue({ id: 'job-1' });
  });

  it('returns 200 with valid payload', async () => {
    const res = await request(app)
      .post('/webhook/user-registered')
      .send({
        type: 'user.registered',
        payload: {
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          registered_at: '2026-03-14T10:30:00Z',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'user.registered' })
    );
  });

  it('returns 422 when email is missing', async () => {
    const res = await request(app)
      .post('/webhook/user-registered')
      .send({ type: 'user.registered', payload: { first_name: 'John' } });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.details).toBeDefined();
  });

  it('returns 422 when type is wrong', async () => {
    const res = await request(app)
      .post('/webhook/user-registered')
      .send({ type: 'user.login', payload: { email: 'john@example.com' } });

    expect(res.status).toBe(422);
  });

  it('returns 422 with invalid email format', async () => {
    const res = await request(app)
      .post('/webhook/user-registered')
      .send({
        type: 'user.registered',
        payload: { email: 'not-an-email' },
      });

    expect(res.status).toBe(422);
  });
});

describe('POST /webhook/user-login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    EmailLog.create.mockResolvedValue({ id: 'log-uuid-2', update: jest.fn() });
    enqueueEmail.mockResolvedValue({ id: 'job-2' });
  });

  it('returns 200 with valid payload', async () => {
    const res = await request(app)
      .post('/webhook/user-login')
      .send({
        type: 'user.login',
        payload: {
          email: 'john@example.com',
          name: 'John',
          logged_in_at: '2026-03-14T15:45:00Z',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'user.login' })
    );
  });

  it('returns 422 when payload is missing', async () => {
    const res = await request(app)
      .post('/webhook/user-login')
      .send({ type: 'user.login' });

    expect(res.status).toBe(422);
  });

  it('returns 500 when EmailLog.create throws', async () => {
    EmailLog.create.mockRejectedValue(new Error('DB down'));

    const res = await request(app)
      .post('/webhook/user-login')
      .send({
        type: 'user.login',
        payload: { email: 'john@example.com', name: 'John' },
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
