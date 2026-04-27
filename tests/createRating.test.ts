import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const CREATED_RATING = {
  id: 1,
  userId: 1,
  score: 8,
  tmdbId: '1399',
  mediaType: 'tv',
};

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    rating: {
      create: jest.fn(),
    },
  },
}));

const makeToken = () => jwt.sign({ sub: '1', email: 'test@test.com', role: 'user' }, 'test-secret');

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('POST /ratings', () => {
  it('returns 201 with created rating', async () => {
    (prisma.rating.create as jest.Mock).mockResolvedValue(CREATED_RATING);

    const res = await request(app)
      .post('/ratings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        tmdbId: '1399',
        mediaType: 'tv',
        score: 8,
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(CREATED_RATING);
  });

  it('creates rating with authenticated user id', async () => {
    (prisma.rating.create as jest.Mock).mockResolvedValue(CREATED_RATING);

    await request(app).post('/ratings').set('Authorization', `Bearer ${makeToken()}`).send({
      tmdbId: '1399',
      mediaType: 'tv',
      score: 8,
    });

    expect(prisma.rating.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        tmdbId: '1399',
        mediaType: 'tv',
        score: 8,
      },
    });
  });

  it('returns 400 when rating fields are invalid', async () => {
    const res = await request(app)
      .post('/ratings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        tmdbId: 1399,
        mediaType: 'tv',
        score: 8,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid rating fields/i);
  });

  it('returns 400 when score is out of range', async () => {
    const res = await request(app)
      .post('/ratings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        tmdbId: '1399',
        mediaType: 'tv',
        score: 99,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/score/i);
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).post('/ratings').send({
      tmdbId: '1399',
      mediaType: 'tv',
      score: 8,
    });

    expect(res.status).toBe(401);
  });

  it('returns 500 when Prisma create fails', async () => {
    (prisma.rating.create as jest.Mock).mockRejectedValue(new Error('database fail'));

    const res = await request(app)
      .post('/ratings')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        tmdbId: '1399',
        mediaType: 'tv',
        score: 8,
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/failed to create rating/i);
  });
});