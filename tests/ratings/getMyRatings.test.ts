import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { generateTestToken } from '../testHelpers';
import { resolveLocalUser } from '../../src/auth/resolveLocalUser';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    rating: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../src/auth/resolveLocalUser', () => ({
  resolveLocalUser: jest.fn(),
}));

describe('GET /ratings/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const token = generateTestToken({ sub: 'user-1', role: 'User' });

  it('returns the current user ratings', async () => {
    (resolveLocalUser as jest.Mock).mockResolvedValue({ id: 7 });

    const mockRatings = [
      {
        id: 1,
        userId: 7,
        tmdbId: '550',
        mediaType: 'movie',
        score: 9,
        user: {
          id: 7,
          username: 'alice',
          firstName: 'Alice',
          lastName: 'Smith',
        },
      },
    ];

    (prisma.rating.findMany as jest.Mock).mockResolvedValue(mockRatings);
    (prisma.rating.count as jest.Mock).mockResolvedValue(1);

    const response = await request(app).get('/ratings/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      results: [
        {
          id: 1,
          userId: 7,
          tmdbId: '550',
          mediaType: 'movie',
          score: 9,
          author: { id: 7, displayName: 'Alice Smith' },
        },
      ],
    });

    expect(prisma.rating.findMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 10,
      include: { user: true },
    });
  });

  it('supports pagination', async () => {
    (resolveLocalUser as jest.Mock).mockResolvedValue({ id: 7 });
    (prisma.rating.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.rating.count as jest.Mock).mockResolvedValue(0);

    const response = await request(app)
      .get('/ratings/me?page=2&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(prisma.rating.findMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
      include: { user: true },
    });
  });

  it('returns 401 without a token', async () => {
    const response = await request(app).get('/ratings/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Unauthorized',
    });
  });
});
