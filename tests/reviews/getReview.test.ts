import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

process.env.JWT_SECRET = 'test-secret';

const MOCK_REVIEW = {
  id: 1,
  userId: 123,
  tmdbId: '550',
  mediaType: 'movie',
  title: 'Fight Club',
  description: 'First rule is...',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    review: {
      findUnique: jest.fn(),
    },
  },
}));

describe('GET /reviews/:id', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  it('returns 200 and the review when it exists', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue(MOCK_REVIEW);

    const res = await request(app).get('/reviews/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(MOCK_REVIEW);
    expect(prisma.review.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('returns 404 when the review does not exist', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/reviews/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Review not found');
  });

  it('returns 400 when the ID is not a number', async () => {
    const res = await request(app).get('/reviews/abc');

    expect(res.status).toBe(400);
    expect(res.body.errors.id).toContain('Invalid input: expected number, received NaN');
  });

  it('returns 400 when the ID is not positive', async () => {
    const res = await request(app).get('/reviews/-5');

    expect(res.status).toBe(400);
    expect(res.body.errors.id).toContain('Review ID must be a positive integer');
  });

  it('returns 500 when database fetch fails', async () => {
    (prisma.review.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/reviews/1');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch review');
  });
});
