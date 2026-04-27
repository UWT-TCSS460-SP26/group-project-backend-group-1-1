import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const EXISTING_RATING = {
  id: 1,
  userId: 1,
  score: 5,
  tmdbId: '1399',
  mediaType: 'tv',
};

const UPDATED_RATING = {
  ...EXISTING_RATING,
  score: 9,
};

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    rating: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const makeToken = (sub = '1') =>
  jwt.sign({ sub, email: 'test@test.com', role: 'user' }, 'test-secret');

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('PUT /ratings/:id', () => {
  it('returns 200 with updated rating', async () => {
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(EXISTING_RATING);
    (prisma.rating.update as jest.Mock).mockResolvedValue(UPDATED_RATING);

    const res = await request(app)
      .put('/ratings/1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ score: 9 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(UPDATED_RATING);
    expect(prisma.rating.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { score: 9 },
    });
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).put('/ratings/1').send({ score: 9 });

    expect(res.status).toBe(401);
  });

  it('returns 400 when id is invalid', async () => {
    const res = await request(app)
      .put('/ratings/not-a-number')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ score: 9 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid rating id/i);
  });

  it('returns 400 when score is missing or not an integer', async () => {
    const res = await request(app)
      .put('/ratings/1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ score: 'nine' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid rating fields/i);
  });

  it('returns 400 when score is out of range', async () => {
    const res = await request(app)
      .put('/ratings/1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ score: 99 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/score/i);
  });

  it('returns 404 when rating does not exist', async () => {
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .put('/ratings/999')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ score: 9 });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/rating not found/i);
  });

  it('returns 403 when caller does not own the rating', async () => {
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue({
      ...EXISTING_RATING,
      userId: 42,
    });

    const res = await request(app)
      .put('/ratings/1')
      .set('Authorization', `Bearer ${makeToken('1')}`)
      .send({ score: 9 });

    expect(res.status).toBe(403);
    expect(prisma.rating.update).not.toHaveBeenCalled();
  });

  it('returns 500 when Prisma update fails', async () => {
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(EXISTING_RATING);
    (prisma.rating.update as jest.Mock).mockRejectedValue(new Error('database fail'));

    const res = await request(app)
      .put('/ratings/1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ score: 9 });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/failed to update rating/i);
  });
});
