import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { generateTestToken } from '../testHelpers';

process.env.JWT_SECRET = 'test-secret';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    review: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('DELETE /reviews/:id', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 if review not found', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .delete('/reviews/1')
      .set('Authorization', `Bearer ${generateTestToken({ sub: '1' })}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 if user does not own review', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      userId: 2,
    });

    const res = await request(app)
      .delete('/reviews/1')
      .set('Authorization', `Bearer ${generateTestToken({ sub: '1' })}`);

    expect(res.status).toBe(403);
  });

  it('deletes review successfully when user owns it', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      userId: 1,
    });

    (prisma.review.delete as jest.Mock).mockResolvedValue({
      id: 1,
      userId: 1,
    });

    const res = await request(app)
      .delete('/reviews/1')
      .set('Authorization', `Bearer ${generateTestToken({ sub: '1' })}`);

    expect(res.status).toBe(204);
    expect(prisma.review.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});
