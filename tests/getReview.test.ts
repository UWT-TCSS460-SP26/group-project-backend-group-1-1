import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const REVIEW = {
  id: 1,
  userId: 1,
  title: 'Brilliant',
  description: 'A masterpiece of modern cinema.',
  tmdbId: '1399',
  mediaType: 'tv',
};

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    review: {
      findUnique: jest.fn(),
    },
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('GET /reviews/:id', () => {
  it('returns 200 with review by id', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue(REVIEW);

    const res = await request(app).get('/reviews/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(REVIEW);
  });

  it('returns 400 when id is invalid', async () => {
    const res = await request(app).get('/reviews/not-a-number');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid review id/i);
  });

  it('returns 404 when review is not found', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/reviews/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/review not found/i);
  });

  it('returns 500 when Prisma fails', async () => {
    (prisma.review.findUnique as jest.Mock).mockRejectedValue(new Error('database fail'));

    const res = await request(app).get('/reviews/1');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/failed to fetch review/i);
  });
});
