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

describe('DELETE /ratings/:id', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
    (resolveLocalUser as jest.Mock).mockResolvedValue({ id: USER_ID });
  });

  it('returns 204 on successful delete', async () => {
    const existingRating = { id: 1, userId: USER_ID };
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(existingRating);

    const res = await request(app)
      .delete('/ratings/1')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }));

    expect(res.status).toBe(204);
    expect(prisma.rating.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('returns 403 when caller does not own the rating', async () => {
    const existingRating = { id: 1, userId: 999 };
    (prisma.rating.findUnique as jest.Mock).mockResolvedValue(existingRating);

    const res = await request(app)
      .delete('/ratings/1')
      .set('Authorization', 'Bearer ' + generateTestToken({ sub: USER_ID.toString() }));

    expect(res.status).toBe(403);
  });
});