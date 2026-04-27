import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { Prisma } from '../src/generated/prisma/client';

// Mock the prisma client
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    review: {
      create: jest.fn(),
    },
  },
}));

const JWT_SECRET = 'test-secret';
const USER_ID = 123;
const VALID_TOKEN = jwt.sign(
  { sub: USER_ID.toString(), email: 'test@example.com', role: 'user' },
  JWT_SECRET
);

describe('POST /reviews', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    jest.clearAllMocks();
  });

  const validReview = {
    tmdbId: '550',
    mediaType: 'movie',
    title: 'Great Movie',
    body: 'I really enjoyed this one!',
  };

  it('returns 201 and the created review on success', async () => {
    const mockCreatedReview = {
      id: 1,
      userId: USER_ID,
      ...validReview,
      description: validReview.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (prisma.review.create as jest.Mock).mockResolvedValue(mockCreatedReview);

    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send(validReview);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(mockCreatedReview);
    expect(prisma.review.create).toHaveBeenCalledWith({
      data: {
        userId: USER_ID,
        tmdbId: validReview.tmdbId,
        mediaType: validReview.mediaType,
        title: validReview.title,
        description: validReview.body,
      },
    });
  });

  it('returns 201 with a default title if title is omitted', async () => {
    const reviewWithoutTitle = {
      tmdbId: '1396',
      mediaType: 'tv',
      body: 'Essential viewing.',
    };

    const mockCreatedReview = {
      id: 2,
      userId: USER_ID,
      tmdbId: '1396',
      mediaType: 'tv',
      title: 'Review of 1396',
      description: 'Essential viewing.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (prisma.review.create as jest.Mock).mockResolvedValue(mockCreatedReview);

    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send(reviewWithoutTitle);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Review of 1396');
    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Review of 1396',
        }),
      })
    );
  });

  it('returns 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ mediaType: 'movie' }); // Missing tmdbId and body

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('tmdbId');
    expect(res.body.errors).toHaveProperty('body');
  });

  it('returns 400 for invalid mediaType', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send({ ...validReview, mediaType: 'book' });

    expect(res.status).toBe(400);
    expect(res.body.errors.mediaType).toContain('Invalid option: expected one of "movie"|"tv"');
  });

  it('returns 401 if Authorization header is missing', async () => {
    const res = await request(app).post('/reviews').send(validReview);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Missing or malformed Authorization header/);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', 'Bearer invalid-token')
      .send(validReview);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid or expired token/);
  });

  it('returns 409 if user already reviewed the media (P2002)', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '7.8.0',
    });

    (prisma.review.create as jest.Mock).mockRejectedValue(prismaError);

    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send(validReview);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('You have already reviewed this media item');
  });

  it('returns 500 if database creation fails unexpectedly', async () => {
    (prisma.review.create as jest.Mock).mockRejectedValue(new Error('DB failure'));

    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${VALID_TOKEN}`)
      .send(validReview);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to create review');
  });
});
