import request from 'supertest';
import { app } from '../../src/app';

describe('v1 Hello Routes', () => {
  it('GET /v1/hello — returns hello message', async () => {
    const res = await request(app).get('/v1/hello');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hello, you sent a GET request');
  });

  it('POST /v1/hello — returns hello message with 201', async () => {
    const res = await request(app).post('/v1/hello');
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Hello, you sent a POST request');
  });

  it('PUT /v1/hello — returns hello message', async () => {
    const res = await request(app).put('/v1/hello');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hello, you sent a PUT request');
  });

  it('PATCH /v1/hello — returns hello message', async () => {
    const res = await request(app).patch('/v1/hello');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hello, you sent a PATCH request');
  });

  it('DELETE /v1/hello — returns hello message', async () => {
    const res = await request(app).delete('/v1/hello');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hello, you sent a DELETE request');
  });
});
