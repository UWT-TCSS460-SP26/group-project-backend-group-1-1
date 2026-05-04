import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { generateTestToken } from '../testHelpers';
import { resolveLocalUser } from '../../src/auth/resolveLocalUser';

process.env.JWT_SECRET = 'test-secret';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    rating: {
      findUnique: jest.fn(),
      update: jest.fn(),
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

describe('PUT /ratings/:id', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
    (resolveLocalUser as jest.Mock).mockResolvedValue({ id: USER_ID });
  });

  it('returns 200 on successful update', async () => {
    const existingRating = { id: 1, userId: USER_ID, score: 5 };
    const updatedRating = { ...existingRating, score: 9 };

    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(existingRating);
    (prisma.rating.update as jest.Mock).mockResolvedValue(updatedRating);

    const res = await request(app)
      .put('/ratings/1')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }))
      .send({ score: 9 });

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(9);
  });

  it('returns 403 if caller does not own the rating', async () => {
    const existingRating = { id: 1, userId: 999, score: 5 };
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(existingRating);

    const res = await request(app)
      .put('/ratings/1')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }))
      .send({ score: 9 });

    expect(res.status).toBe(403);
  });
});
