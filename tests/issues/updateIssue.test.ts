import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { generateTestToken } from '../testHelpers';
import { Prisma } from '../../src/generated/prisma/client';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    issue: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('PATCH /issues/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const adminToken = generateTestToken({ sub: 'admin-1', role: 'Admin' });
  const userToken = generateTestToken({ sub: 'user-1', role: 'User' });

  it('successfully updates status for an admin', async () => {
    const mockIssue = {
      id: 1,
      title: 'Bug report',
      status: 'IN_PROGRESS',
    };

    (prisma.issue.update as jest.Mock).mockResolvedValue(mockIssue);

    const response = await request(app)
      .patch('/issues/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('IN_PROGRESS');
    expect(prisma.issue.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'IN_PROGRESS' },
    });
  });

  it('returns 404 when issue is not found', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: 'mock',
    });
    (prisma.issue.update as jest.Mock).mockRejectedValue(error);

    const response = await request(app)
      .patch('/issues/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Issue not found');
  });

  it('returns 400 for invalid status', async () => {
    const response = await request(app)
      .patch('/issues/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INVALID_STATUS' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid update data');
  });

  it('returns 403 for non-admin user', async () => {
    const response = await request(app)
      .patch('/issues/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'RESOLVED' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Insufficient permissions');
  });

  it('returns 401 when no token is provided', async () => {
    const response = await request(app).patch('/issues/1').send({ status: 'RESOLVED' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  it('allows updating multiple fields at once', async () => {
    const mockIssue = {
      id: 1,
      title: 'New Title',
      status: 'RESOLVED',
    };

    (prisma.issue.update as jest.Mock).mockResolvedValue(mockIssue);

    const response = await request(app)
      .patch('/issues/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED', title: 'New Title' });

    expect(response.status).toBe(200);
    expect(prisma.issue.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'RESOLVED', title: 'New Title' },
    });
  });

  it('returns 200 and original issue when body is empty', async () => {
    const mockIssue = { id: 1, title: 'Same' };
    (prisma.issue.findUnique as jest.Mock).mockResolvedValue(mockIssue);

    const response = await request(app)
      .patch('/issues/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Same');
    expect(prisma.issue.update).not.toHaveBeenCalled();
  });
});
