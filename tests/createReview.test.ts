import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const CREATED_REVIEW = {
  id: 1,
  userId: 1,
  title: 'Brilliant',
  description: 'A masterpiece of modern cinema.',
  tmdbId: '1399',
  mediaType: 'tv',
};

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    review: {
      create: jest.fn(),
    },
  },
}));

const makeToken = () => jwt.sign({ sub: '1', email: 'test@test.com', role: 'user' }, 'test-secret');

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('POST /reviews', () => {
  it('returns 201 with created review', async () => {
    (prisma.review.create as jest.Mock).mockResolvedValue(CREATED_REVIEW);

    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        tmdbId: '1399',
        mediaType: 'tv',
        title: 'Brilliant',
        description: 'A masterpiece of modern cinema.',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(CREATED_REVIEW);
  });

  it('creates review with authenticated user id', async () => {
    (prisma.review.create as jest.Mock).mockResolvedValue(CREATED_REVIEW);

    await request(app).post('/reviews').set('Authorization', `Bearer ${makeToken()}`).send({
      tmdbId: '1399',
      mediaType: 'tv',
      title: 'Brilliant',
      description: 'A masterpiece of modern cinema.',
    });

    expect(prisma.review.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        tmdbId: '1399',
        mediaType: 'tv',
        title: 'Brilliant',
        description: 'A masterpiece of modern cinema.',
      },
    });
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).post('/reviews').send({
      tmdbId: '1399',
      mediaType: 'tv',
      title: 'Brilliant',
      description: 'A masterpiece of modern cinema.',
    });

    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are invalid types', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        tmdbId: 1399,
        mediaType: 'tv',
        title: 'Brilliant',
        description: 'A masterpiece of modern cinema.',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid review fields/i);
  });

  it('returns 400 when mediaType is not movie or tv', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        tmdbId: '1399',
        mediaType: 'book',
        title: 'Brilliant',
        description: 'A masterpiece of modern cinema.',
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 when title or description is empty', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        tmdbId: '1399',
        mediaType: 'tv',
        title: '   ',
        description: 'A masterpiece of modern cinema.',
      });

    expect(res.status).toBe(400);
  });

  it('returns 500 when Prisma create fails', async () => {
    (prisma.review.create as jest.Mock).mockRejectedValue(new Error('database fail'));

    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        tmdbId: '1399',
        mediaType: 'tv',
        title: 'Brilliant',
        description: 'A masterpiece of modern cinema.',
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/failed to create review/i);
  });
});
