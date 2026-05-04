import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { generateTestToken } from '../testHelpers';
import { resolveLocalUser } from '../../src/auth/resolveLocalUser';

process.env.JWT_SECRET = 'test-secret';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    review: {
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

describe('PUT /reviews/:id', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
    (resolveLocalUser as jest.Mock).mockResolvedValue({ id: USER_ID });
  });

  const validUpdate = {
    title: 'New Title',
    description: 'Updated description',
  };

  it('returns 200 and updated review on success', async () => {
    const existingReview = { id: 1, userId: USER_ID, title: 'Old', description: 'Old' };
    const updatedReview = { ...existingReview, ...validUpdate };

    (prisma.review.findUnique as jest.Mock).mockResolvedValue(existingReview);
    (prisma.review.update as jest.Mock).mockResolvedValue(updatedReview);

    const res = await request(app)
      .put('/reviews/1')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }))
      .send(validUpdate);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedReview);
  });

  it('returns 403 if user does not own the review', async () => {
    const existingReview = { id: 1, userId: 999, title: 'Old', description: 'Old' };

    (prisma.review.findUnique as jest.Mock).mockResolvedValue(existingReview);

    const res = await request(app)
      .put('/reviews/1')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }))
      .send(validUpdate);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('returns 404 if review not found', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .put('/reviews/1')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }))
      .send(validUpdate);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Review not found');
  });
});
