import request from 'supertest';
import express from 'express';

import { ratingsRouter } from '../../src/routes/ratings';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    rating: {
      groupBy: jest.fn(),
    },
  },
}));

global.fetch = jest.fn();

const app = express();
app.use(express.json());
app.use('/ratings', ratingsRouter);

describe('GET /ratings/top-rated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns top rated items', async () => {

    (prisma.rating.groupBy as jest.Mock).mockResolvedValue([
      {
        tmdbId: '550',
        mediaType: 'movie',
        _avg: {
          score: 4.5,
        },
        _count: {
          score: 2,
        },
      },
    ]);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'Fight Club',
      }),
    });

    const response = await request(app).get('/ratings/top-rated');

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].tmdb.title).toBe('Fight Club');
  });
});