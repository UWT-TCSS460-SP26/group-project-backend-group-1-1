import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { generateTestToken } from '../testHelpers';

process.env.JWT_SECRET = 'test-secret';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    review: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('PUT /reviews/:id', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 if review not found', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .put('/reviews/1')
      .set('Authorization', `Bearer ${generateTestToken({ sub: '1' })}`)
      .send({
        title: 'Updated',
        description: 'Updated desc',
      });

    expect(res.status).toBe(404);
  });

  it('returns 403 if user does not own review', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      userId: 2,
    });

    const res = await request(app)
      .put('/reviews/1')
      .set('Authorization', `Bearer ${generateTestToken({ sub: '1' })}`)
      .send({
        title: 'Updated',
        description: 'Updated desc',
      });

    expect(res.status).toBe(403);
  });

  it('updates review successfully', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      userId: 1,
    });

    (prisma.review.update as jest.Mock).mockResolvedValue({
      id: 1,
      userId: 1,
      title: 'Updated',
      description: 'Updated desc',
      tmdbId: '123',
      mediaType: 'movie',
    });

    const res = await request(app)
      .put('/reviews/1')
      .set('Authorization', `Bearer ${generateTestToken({ sub: '1' })}`)
      .send({
        title: 'Updated',
        description: 'Updated desc',
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
    expect(res.body.description).toBe('Updated desc');
  });
});
