import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

process.env.JWT_SECRET = 'test-secret';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    review: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /reviews/media/:mediaType/:tmdbId', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 for invalid media type', async () => {
    const res = await request(app).get('/reviews/media/invalid/123');

    expect(res.status).toBe(400);
    expect(res.body.errors.mediaType).toBeDefined();
  });

  it('returns 404 if tmdbId is missing because route does not match', async () => {
    const res = await request(app).get('/reviews/media/movie/');

    expect(res.status).toBe(404);
  });

  it('returns reviews successfully', async () => {
    (prisma.review.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        userId: 1,
        title: 'Great movie',
        description: 'I really liked it',
        tmdbId: '123',
        mediaType: 'movie',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          username: 'alice',
          firstName: 'Alice',
          lastName: 'Smith',
        },
      },
    ]);

    const res = await request(app).get('/reviews/media/movie/123');

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].title).toBe('Great movie');
    expect(res.body.results[0].author).toEqual({ id: 1, displayName: 'Alice Smith' });
    expect(res.body.results[0].user).toBeUndefined();
  });
});
