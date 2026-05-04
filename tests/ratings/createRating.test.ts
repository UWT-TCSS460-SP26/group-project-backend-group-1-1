import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { Prisma } from '../../src/generated/prisma/client';
import { generateTestToken } from '../testHelpers';
import { resolveLocalUser } from '../../src/auth/resolveLocalUser';

process.env.JWT_SECRET = 'test-secret';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    rating: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../src/auth/resolveLocalUser', () => ({
  resolveLocalUser: jest.fn(),
}));

const USER_ID = 123;

describe('POST /ratings', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
    (resolveLocalUser as jest.Mock).mockResolvedValue({ id: USER_ID });
  });

  const validRating = {
    tmdbId: '1399',
    mediaType: 'tv',
    score: 8,
  };

  const CREATED_RATING = {
    id: 1,
    userId: USER_ID,
    ...validRating,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('returns 201 with created rating', async () => {
    (prisma.rating.create as jest.Mock).mockResolvedValue(CREATED_RATING);

    const res = await request(app)
      .post('/ratings')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }))
      .send(validRating);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(CREATED_RATING);
  });

  it('creates rating with authenticated user id', async () => {
    (prisma.rating.create as jest.Mock).mockResolvedValue(CREATED_RATING);

    await request(app)
      .post('/ratings')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }))
      .send(validRating);

    expect(prisma.rating.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        tmdbId: '1399',
        mediaType: 'tv',
        score: 8,
      },
    });
  });

  it('returns 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/ratings')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }))
      .send({ tmdbId: '1399' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid rating fields/i);
  });

  it('returns 400 for invalid score', async () => {
    const res = await request(app)
      .post('/ratings')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }))
      .send({ ...validRating, score: 11 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/score must be between 0 and 10/i);
  });

  it('returns 401 if Authorization header is missing', async () => {
    const res = await request(app).post('/ratings').send(validRating);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 409 if user already rated this media', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '7.8.0',
    });
    (prisma.rating.create as jest.Mock).mockRejectedValue(prismaError);

    const res = await request(app)
      .post('/ratings')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }))
      .send(validRating);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already/i);
  });

  it('returns 500 if database creation fails', async () => {
    (prisma.rating.create as jest.Mock).mockRejectedValue(new Error('DB failure'));

    const res = await request(app)
      .post('/ratings')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }))
      .send(validRating);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to create rating');
  });
});