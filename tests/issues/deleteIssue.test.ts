import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { generateTestToken } from '../testHelpers';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    issue: {
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('DELETE /issues/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const adminToken = generateTestToken({ sub: 'admin-1', role: 'Admin' });
  const userToken = generateTestToken({ sub: 'user-1', role: 'User' });

  it('returns 200 when an admin deletes an issue', async () => {
    (prisma.issue.delete as jest.Mock).mockResolvedValue({
      id: 1,
      title: 'Bug report',
    });

    const response = await request(app)
      .delete('/issues/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Issue deleted successfully',
    });

    expect(prisma.issue.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('returns 400 for invalid issue id', async () => {
    const response = await request(app)
      .delete('/issues/not-a-number')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.errors.id).toBeDefined();
  });

  it('returns 403 for non-admin users', async () => {
    const response = await request(app)
      .delete('/issues/1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });
});
