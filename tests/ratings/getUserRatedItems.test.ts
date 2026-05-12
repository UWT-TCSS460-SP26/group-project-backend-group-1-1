import request from 'supertest';
import express from 'express';

import { ratingsRouter } from '../../src/routes/ratings';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    rating: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../src/middleware/requireAuth', () => ({
  requireAuth: [
    (request: { user?: { sub: string } }, _response: unknown, next: () => void) => {
      request.user = {
        sub: 'auth0|123',
      };

      next();
    },
  ],
}));
global.fetch = jest.fn();

const app = express();
app.use(express.json());
app.use('/ratings', ratingsRouter);

describe('GET /ratings/me/items', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns current user rated items', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      username: 'harleen',
      firstName: 'Harleen',
      lastName: 'Kaur',
    });

    (prisma.rating.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        score: 5,
        tmdbId: '550',
        mediaType: 'movie',
        createdAt: new Date(),
        user: {
          id: 1,
          username: 'harleen',
          firstName: 'Harleen',
          lastName: 'Kaur',
        },
      },
    ]);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'Fight Club',
      }),
    });

    const response = await request(app).get('/ratings/me/items');

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].tmdb.title).toBe('Fight Club');
    expect(response.body[0].author.displayName).toBe('Harleen Kaur');
  });
});
