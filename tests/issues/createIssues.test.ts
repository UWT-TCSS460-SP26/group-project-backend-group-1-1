import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    issue: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('POST /issues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an issue with valid input', async () => {
    const mockIssue = {
      id: 1,
      title: 'Bug test',
      description: 'Something broke',
      stepsToReproduce: 'Click the button',
      reporterEmail: 'test@test.com',
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.issue.create as jest.Mock).mockResolvedValue(mockIssue);

    const response = await request(app).post('/issues').send({
      title: 'Bug test',
      description: 'Something broke',
      stepsToReproduce: 'Click the button',
      reporterEmail: 'test@test.com',
    });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Bug test');
    expect(response.body.description).toBe('Something broke');
  });

  it('returns 400 when title is missing', async () => {
    const response = await request(app).post('/issues').send({
      description: 'Something broke',
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.title[0]).toBe('Invalid input: expected string, received undefined');
  });

  it('returns 400 when description is missing', async () => {
    const response = await request(app).post('/issues').send({
      title: 'Bug test',
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.description[0]).toBe('Invalid input: expected string, received undefined');
  });
});
