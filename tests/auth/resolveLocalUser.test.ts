import { resolveLocalUser } from '../../src/auth/resolveLocalUser';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const findUnique = prisma.user.findUnique as jest.Mock;
const upsert = prisma.user.upsert as jest.Mock;

const ORIGINAL_FETCH = global.fetch;

const mockFetchResponse = (body: unknown, ok = true, status = 200) =>
  ({
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad',
    json: async () => body,
  }) as unknown as Response;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.AUTH_ISSUER = 'https://issuer.example';
});

afterEach(() => {
  global.fetch = ORIGINAL_FETCH;
});

describe('resolveLocalUser fast path', () => {
  it('returns the cached user without calling userinfo', async () => {
    const cached = { id: 7, subjectId: 'sub-1', username: 'alice', email: 'a@x.test' };
    findUnique.mockResolvedValue(cached);
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const result = await resolveLocalUser('sub-1', 'token-abc');

    expect(result).toEqual(cached);
    expect(findUnique).toHaveBeenCalledWith({ where: { subjectId: 'sub-1' } });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe('resolveLocalUser slow path', () => {
  it('fetches userinfo and upserts a new local row', async () => {
    findUnique.mockResolvedValue(null);
    const fetchSpy = jest.fn().mockResolvedValue(
      mockFetchResponse({
        sub: 'sub-2',
        email: 'bob@x.test',
        preferred_username: 'bob',
        given_name: 'Bob',
        family_name: 'Smith',
        role: 'Moderator',
      })
    );
    global.fetch = fetchSpy as unknown as typeof fetch;
    const created = {
      id: 8,
      subjectId: 'sub-2',
      username: 'bob',
      email: 'bob@x.test',
      role: 'Moderator',
    };
    upsert.mockResolvedValue(created);

    const result = await resolveLocalUser('sub-2', 'token-xyz');

    expect(result).toEqual(created);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://issuer.example/v2/oauth/userinfo',
      expect.objectContaining({
        headers: { Authorization: 'Bearer token-xyz' },
      })
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { subjectId: 'sub-2' },
        create: expect.objectContaining({
          subjectId: 'sub-2',
          username: 'bob',
          email: 'bob@x.test',
          firstName: 'Bob',
          lastName: 'Smith',
          role: 'Moderator',
        }),
      })
    );
  });

  it('falls back when userinfo omits optional fields', async () => {
    findUnique.mockResolvedValue(null);
    global.fetch = jest
      .fn()
      .mockResolvedValue(mockFetchResponse({ sub: 'sub-3' })) as unknown as typeof fetch;
    upsert.mockImplementation(async ({ create }) => ({ id: 9, ...create }));

    const result = await resolveLocalUser('sub-3', 'token');

    expect(result).toMatchObject({
      subjectId: 'sub-3',
      username: 'sub-3',
      email: 'sub-3@unknown.local',
      firstName: null,
      lastName: null,
      role: 'User',
    });
  });

  it('throws when the userinfo request fails', async () => {
    findUnique.mockResolvedValue(null);
    global.fetch = jest
      .fn()
      .mockResolvedValue(mockFetchResponse({}, false, 503)) as unknown as typeof fetch;

    await expect(resolveLocalUser('sub-4', 'token')).rejects.toThrow(/userinfo fetch failed/);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('throws when AUTH_ISSUER is not configured', async () => {
    findUnique.mockResolvedValue(null);
    delete process.env.AUTH_ISSUER;
    await expect(resolveLocalUser('sub-5', 'token')).rejects.toThrow(/AUTH_ISSUER/);
  });
});
