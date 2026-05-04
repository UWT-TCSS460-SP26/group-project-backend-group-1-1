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
      delete: jest.fn(),
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

describe('DELETE /reviews/:id', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
    (resolveLocalUser as jest.Mock).mockResolvedValue({ id: USER_ID });
  });

  it('returns 204 on success', async () => {
    const existingReview = { id: 1, userId: USER_ID };
    (prisma.review.findUnique as jest.Mock).mockResolvedValue(existingReview);

    const res = await request(app)
      .delete('/reviews/1')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }));

    expect(res.status).toBe(204);
    expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('allows Admin to delete any review', async () => {
    const existingReview = { id: 1, userId: 999 };
    (prisma.review.findUnique as jest.Mock).mockResolvedValue(existingReview);

    const res = await request(app)
      .delete('/reviews/1')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString(), role: 'Admin' }));

    expect(res.status).toBe(204);
  });

  it('returns 403 if user is not owner or admin', async () => {
    const existingReview = { id: 1, userId: 999 };
    (prisma.review.findUnique as jest.Mock).mockResolvedValue(existingReview);

    const res = await request(app)
      .delete('/reviews/1')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString(), role: 'User' }));

    expect(res.status).toBe(403);
  });
});