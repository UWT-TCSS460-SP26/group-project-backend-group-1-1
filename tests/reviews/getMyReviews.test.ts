import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { generateTestToken } from '../testHelpers';
import { resolveLocalUser } from '../../src/auth/resolveLocalUser';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    review: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../src/auth/resolveLocalUser', () => ({
  resolveLocalUser: jest.fn(),
}));

describe('GET /reviews/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const token = generateTestToken({ sub: 'user-1', role: 'User' });

  it('returns the current user reviews', async () => {
    (resolveLocalUser as jest.Mock).mockResolvedValue({ id: 7 });

    const mockReviews = [
      {
        id: 1,
        userId: 7,
        tmdbId: '550',
        mediaType: 'movie',
        title: 'Good movie',
        description: 'I liked it',
      },
    ];

    (prisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);
    (prisma.review.count as jest.Mock).mockResolvedValue(1);

    const response = await request(app).get('/reviews/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      results: mockReviews,
    });

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('supports pagination', async () => {
    (resolveLocalUser as jest.Mock).mockResolvedValue({ id: 7 });
    (prisma.review.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.review.count as jest.Mock).mockResolvedValue(0);

    const response = await request(app)
      .get('/reviews/me?page=2&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
    });
  });

  it('returns 401 without a token', async () => {
    const response = await request(app).get('/reviews/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Unauthorized',
    });
  });
});
