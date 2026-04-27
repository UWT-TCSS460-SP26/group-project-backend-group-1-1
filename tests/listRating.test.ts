import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const RATINGS = [
  {
    id: 1,
    userId: 1,
    score: 8,
    tmdbId: '1399',
    mediaType: 'tv',
  },
];

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    rating: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('GET /ratings/media/:mediaType/:tmdbId', () => {
  it('returns 200 with ratings for a media item', async () => {
    (prisma.rating.findMany as jest.Mock).mockResolvedValue(RATINGS);
    (prisma.rating.aggregate as jest.Mock).mockResolvedValue({
      _count: 1,
      _avg: { score: 8 },
    });

    const res = await request(app).get('/ratings/media/tv/1399');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      averageScore: 8,
      results: RATINGS,
    });
  });

  it('uses page and limit query params', async () => {
    (prisma.rating.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.rating.aggregate as jest.Mock).mockResolvedValue({
      _count: 0,
      _avg: { score: null },
    });

    const res = await request(app).get('/ratings/media/movie/550?page=2&limit=5');

    expect(res.status).toBe(200);
    expect(prisma.rating.findMany).toHaveBeenCalledWith({
      where: { mediaType: 'movie', tmdbId: '550' },
      skip: 5,
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns 400 for invalid mediaType', async () => {
    const res = await request(app).get('/ratings/media/book/1399');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid mediaType/i);
  });

  it('returns 500 when Prisma fails', async () => {
    (prisma.rating.findMany as jest.Mock).mockRejectedValue(new Error('database fail'));

    const res = await request(app).get('/ratings/media/tv/1399');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/failed to fetch ratings/i);
  });
});