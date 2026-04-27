import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const RATING = {
  id: 1,
  userId: 1,
  score: 8,
  tmdbId: '1399',
  mediaType: 'tv',
};

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    rating: {
      findUnique: jest.fn(),
    },
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('GET /ratings/:id', () => {
  it('returns 200 with rating by id', async () => {
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(RATING);

    const res = await request(app).get('/ratings/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(RATING);
  });

  it('returns 400 when id is invalid', async () => {
    const res = await request(app).get('/ratings/not-a-number');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid rating id/i);
  });

  it('returns 404 when rating is not found', async () => {
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/ratings/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/rating not found/i);
  });

  it('returns 500 when Prisma fails', async () => {
    (prisma.rating.findUnique as jest.Mock).mockRejectedValue(new Error('database fail'));

    const res = await request(app).get('/ratings/1');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/failed to fetch rating/i);
  });
});
