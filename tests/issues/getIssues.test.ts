import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { generateTestToken } from '../testHelpers';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    issue: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('GET /issues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const adminToken = generateTestToken({ sub: 'admin-1', role: 'Admin' });

  it('returns a paginated list of issues for an admin', async () => {
    const mockIssues = [
      { id: 1, title: 'Bug 1', status: 'OPEN', createdAt: new Date() },
      { id: 2, title: 'Bug 2', status: 'OPEN', createdAt: new Date() },
    ];

    (prisma.issue.findMany as jest.Mock).mockResolvedValue(mockIssues);
    (prisma.issue.count as jest.Mock).mockResolvedValue(2);

    const response = await request(app)
      .get('/issues?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(2);
    expect(response.body.total).toBe(2);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(10);
  });

  it('filters issues by status', async () => {
    (prisma.issue.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.issue.count as jest.Mock).mockResolvedValue(0);

    await request(app).get('/issues?status=CLOSED').set('Authorization', `Bearer ${adminToken}`);

    expect(prisma.issue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'CLOSED' },
      })
    );
  });

  it('respects pagination params', async () => {
    (prisma.issue.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.issue.count as jest.Mock).mockResolvedValue(0);

    await request(app).get('/issues?page=2&limit=5').set('Authorization', `Bearer ${adminToken}`);

    expect(prisma.issue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      })
    );
  });

  it('returns 403 for non-admin user', async () => {
    const userToken = generateTestToken({ sub: 'user-1', role: 'User' });
    const response = await request(app).get('/issues').set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });
});
