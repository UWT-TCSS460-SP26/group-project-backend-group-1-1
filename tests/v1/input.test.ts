import request from 'supertest';
import { app } from '../../src/app';

describe('v1 Input Routes (no validation)', () => {
  describe('GET /v1/input/search', () => {
    it('echoes query params', async () => {
      const res = await request(app).get('/v1/input/search?q=test&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.query.q).toBe('test');
      expect(res.body.query.limit).toBe('5');
    });

    it('returns null for missing params', async () => {
      const res = await request(app).get('/v1/input/search');
      expect(res.status).toBe(200);
      expect(res.body.query.q).toBeNull();
    });
  });

  describe('GET /v1/input/users/:id', () => {
    it('echoes the route param', async () => {
      const res = await request(app).get('/v1/input/users/42');
      expect(res.status).toBe(200);
      expect(res.body.params.id).toBe('42');
    });

    it('accepts non-numeric id (no validation in v1)', async () => {
      const res = await request(app).get('/v1/input/users/abc');
      expect(res.status).toBe(200);
      expect(res.body.params.id).toBe('abc');
    });
  });

  describe('POST /v1/input/users', () => {
    it('echoes the request body', async () => {
      const res = await request(app)
        .post('/v1/input/users')
        .send({ name: 'Jane', email: 'jane@example.com' });
      expect(res.status).toBe(201);
      expect(res.body.body.name).toBe('Jane');
      expect(res.body.body.email).toBe('jane@example.com');
    });

    it('accepts empty body (no validation in v1)', async () => {
      const res = await request(app).post('/v1/input/users').send({});
      expect(res.status).toBe(201);
    });
  });

  describe('GET /v1/input/headers', () => {
    it('echoes custom headers', async () => {
      const res = await request(app)
        .get('/v1/input/headers')
        .set('x-request-id', 'req-123')
        .set('x-custom-header', 'my-value');
      expect(res.status).toBe(200);
      expect(res.body.headers['x-request-id']).toBe('req-123');
      expect(res.body.headers['x-custom-header']).toBe('my-value');
    });
  });
});
