import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { generateTestToken } from '../testHelpers';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    issue: {
      findUnique: jest.fn(),
    },
  },
}));

describe('GET /issues/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const adminToken = generateTestToken({ sub: 'admin-1', role: 'Admin' });
  const userToken = generateTestToken({ sub: 'user-1', role: 'User' });

  it('returns 200 and the issue for an admin', async () => {
    const mockIssue = {
      id: 1,
      title: 'Bug report',
      description: 'Something is wrong',
      status: 'OPEN',
      createdAt: new Date(),
    };

    (prisma.issue.findUnique as jest.Mock).mockResolvedValue(mockIssue);

    const response = await request(app)
      .get('/issues/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
    expect(response.body.title).toBe('Bug report');
  });

  it('returns 404 when issue is not found', async () => {
    (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .get('/issues/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Issue not found');
  });

  it('returns 400 for invalid ID', async () => {
    const response = await request(app)
      .get('/issues/abc')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid issue ID');
  });

  it('returns 403 for non-admin user', async () => {
    const response = await request(app)
      .get('/issues/1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Insufficient permissions');
  });

  it('returns 401 when no token is provided', async () => {
    const response = await request(app).get('/issues/1');

    // Note: The mock express-jwt might return 401 or just not set req.auth.
    // Based on requireAuth implementation, it should fail if user is not attached.
    expect(response.status).toBe(401);
  });
});
