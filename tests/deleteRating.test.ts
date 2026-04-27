import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const EXISTING_RATING = {
  id: 1,
  userId: 1,
  score: 5,
  tmdbId: '1399',
  mediaType: 'tv',
};

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    rating: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const makeToken = (sub = '1') =>
  jwt.sign({ sub, email: 'test@test.com', role: 'user' }, 'test-secret');

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('DELETE /ratings/:id', () => {
  it('returns 204 on successful delete', async () => {
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(EXISTING_RATING);
    (prisma.rating.delete as jest.Mock).mockResolvedValue(EXISTING_RATING);

    const res = await request(app)
      .delete('/ratings/1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(204);
    expect(prisma.rating.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).delete('/ratings/1');

    expect(res.status).toBe(401);
  });

  it('returns 400 when id is invalid', async () => {
    const res = await request(app)
      .delete('/ratings/not-a-number')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid rating id/i);
  });

  it('returns 404 when rating does not exist', async () => {
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .delete('/ratings/999')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/rating not found/i);
  });

  it('returns 403 when caller does not own the rating', async () => {
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue({
      ...EXISTING_RATING,
      userId: 42,
    });

    const res = await request(app)
      .delete('/ratings/1')
      .set('Authorization', `Bearer ${makeToken('1')}`);

    expect(res.status).toBe(403);
    expect(prisma.rating.delete).not.toHaveBeenCalled();
  });

  it('returns 500 when Prisma delete fails', async () => {
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(EXISTING_RATING);
    (prisma.rating.delete as jest.Mock).mockRejectedValue(new Error('database fail'));

    const res = await request(app)
      .delete('/ratings/1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/failed to delete rating/i);
  });
});
