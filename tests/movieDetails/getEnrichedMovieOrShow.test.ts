import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    rating: {
      aggregate: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
    },
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('GET /details/:mediaType/:id/enriched', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns combined TMDB + community data on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 550, title: 'Fight Club', overview: 'A movie.' }),
    });

    (prisma.rating.aggregate as jest.Mock).mockResolvedValue({
      _avg: { score: 8.5 },
      _count: 4,
    });

    (prisma.review.findMany as jest.Mock).mockResolvedValue([
      { id: 1, title: 'Great', description: 'Loved it', tmdbId: '550', mediaType: 'movie' },
    ]);

    const res = await request(app).get('/details/movie/550/enriched');

    expect(res.status).toBe(200);
    expect(res.body.tmdb).toEqual({ id: 550, title: 'Fight Club', overview: 'A movie.' });
    expect(res.body.ratings).toEqual({ average: 8.5, count: 4 });
    expect(res.body.reviews).toHaveLength(1);
    expect(prisma.rating.aggregate).toHaveBeenCalledWith({
      where: { tmdbId: '550', mediaType: 'movie' },
      _avg: { score: true },
      _count: true,
    });
  });

  it('returns 0 average when no ratings exist', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1399, name: 'Game of Thrones' }),
    });

    (prisma.rating.aggregate as jest.Mock).mockResolvedValue({
      _avg: { score: null },
      _count: 0,
    });

    (prisma.review.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get('/details/tv/1399/enriched');

    expect(res.status).toBe(200);
    expect(res.body.ratings).toEqual({ average: 0, count: 0 });
    expect(res.body.reviews).toEqual([]);
  });

  it('returns 400 when mediaType is invalid', async () => {
    const res = await request(app).get('/details/book/550/enriched');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid media type');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(prisma.rating.aggregate).not.toHaveBeenCalled();
  });

  it('returns 500 when an unexpected error is thrown', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));

    const res = await request(app).get('/details/movie/550/enriched');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch enriched data');
  });
});
