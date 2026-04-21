import request from 'supertest';
import { app } from '../../src/app';

describe('v2 Input Routes (with validation)', () => {
  describe('GET /v2/input/search', () => {
    it('returns results when q is provided', async () => {
      const res = await request(app).get('/v2/input/search?q=test');
      expect(res.status).toBe(200);
      expect(res.body.query.q).toBe('test');
    });

    it('returns 400 when q is missing', async () => {
      const res = await request(app).get('/v2/input/search');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/q/i);
    });
  });

  describe('GET /v2/input/users/:id', () => {
    it('returns user when id is a positive integer', async () => {
      const res = await request(app).get('/v2/input/users/42');
      expect(res.status).toBe(200);
      expect(res.body.params.id).toBe('42');
    });

    it('returns 400 when id is not numeric', async () => {
      const res = await request(app).get('/v2/input/users/abc');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/id/i);
    });

    it('returns 400 when id is zero', async () => {
      const res = await request(app).get('/v2/input/users/0');
      expect(res.status).toBe(400);
    });

    it('returns 400 when id is negative', async () => {
      const res = await request(app).get('/v2/input/users/-1');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /v2/input/users', () => {
    it('creates user when name and email are provided', async () => {
      const res = await request(app)
        .post('/v2/input/users')
        .send({ name: 'Jane', email: 'jane@example.com' });
      expect(res.status).toBe(201);
      expect(res.body.body.name).toBe('Jane');
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app).post('/v2/input/users').send({ email: 'jane@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(expect.arrayContaining([expect.stringMatching(/name/i)]));
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app).post('/v2/input/users').send({ name: 'Jane' });
      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(expect.arrayContaining([expect.stringMatching(/email/i)]));
    });

    it('returns 400 with both errors when body is empty', async () => {
      const res = await request(app).post('/v2/input/users').send({});
      expect(res.status).toBe(400);
      expect(res.body.details).toHaveLength(2);
    });
  });

  describe('GET /v2/input/headers', () => {
    it('echoes custom headers (no additional validation)', async () => {
      const res = await request(app).get('/v2/input/headers').set('x-request-id', 'req-456');
      expect(res.status).toBe(200);
      expect(res.body.headers['x-request-id']).toBe('req-456');
    });
  });
});
