import request from 'supertest';
import { app } from '../../src/app';

describe('v2 Hello Routes (with middleware)', () => {
  it('GET /v2/hello — returns hello message', async () => {
    const res = await request(app).get('/v2/hello');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hello, you sent a GET request');
  });

  it('POST /v2/hello — returns hello message with 201', async () => {
    const res = await request(app).post('/v2/hello');
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Hello, you sent a POST request');
  });

  it('PUT /v2/hello — returns hello message', async () => {
    const res = await request(app).put('/v2/hello');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hello, you sent a PUT request');
  });

  it('PATCH /v2/hello — returns hello message', async () => {
    const res = await request(app).patch('/v2/hello');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hello, you sent a PATCH request');
  });

  it('DELETE /v2/hello — returns hello message', async () => {
    const res = await request(app).delete('/v2/hello');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hello, you sent a DELETE request');
  });
});
