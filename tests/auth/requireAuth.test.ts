// jwks-rsa pulls in `jose` (ESM) which Jest can't parse without extra
// transform config. The role helpers under test never touch the JWKS
// verifier, so stub the modules at import time.
jest.mock('jwks-rsa', () => ({
  expressJwtSecret: jest.fn(),
}));
jest.mock('express-jwt', () => ({
  expressjwt: jest.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

import { Request, Response, NextFunction } from 'express';
import {
  requireRole,
  requireRoleAtLeast,
  hasRoleAtLeast,
  Role,
  AuthenticatedUser,
} from '../../src/middleware/requireAuth';

const buildRequest = (user?: Partial<AuthenticatedUser>): Request => {
  const fullUser =
    user === undefined
      ? undefined
      : ({
          sub: 'subject-1',
          role: 'User',
          raw: {},
          ...user,
        } as AuthenticatedUser);
  return { user: fullUser } as unknown as Request;
};

const buildResponse = () => {
  const json = jest.fn();
  const status = jest.fn().mockImplementation(() => ({ json }));
  return { status, json } as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
};

describe('requireRole (exact match)', () => {
  it('passes when role matches exactly', () => {
    const next: NextFunction = jest.fn();
    const response = buildResponse();
    requireRole('Admin')(buildRequest({ role: 'Admin' }), response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
  });

  it('rejects with 403 when role differs (even if higher rank)', () => {
    const next: NextFunction = jest.fn();
    const response = buildResponse();
    // SuperAdmin > Admin in hierarchy, but exact-match rejects.
    requireRole('Admin')(buildRequest({ role: 'SuperAdmin' }), response, next);
    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(403);
  });

  it('rejects with 403 when no user is attached', () => {
    const next: NextFunction = jest.fn();
    const response = buildResponse();
    requireRole('Admin')(buildRequest(), response, next);
    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(403);
  });
});

describe('requireRoleAtLeast (hierarchy)', () => {
  const cases: Array<{ user: Role; min: Role; pass: boolean }> = [
    { user: 'User', min: 'User', pass: true },
    { user: 'User', min: 'Admin', pass: false },
    { user: 'Admin', min: 'Admin', pass: true },
    { user: 'SuperAdmin', min: 'Admin', pass: true },
    { user: 'Owner', min: 'Admin', pass: true },
    { user: 'Moderator', min: 'Admin', pass: false },
  ];

  it.each(cases)('user=$user, min=$min → pass=$pass', ({ user, min, pass }) => {
    const next: NextFunction = jest.fn();
    const response = buildResponse();
    requireRoleAtLeast(min)(buildRequest({ role: user }), response, next);
    if (pass) {
      expect(next).toHaveBeenCalledTimes(1);
      expect(response.status).not.toHaveBeenCalled();
    } else {
      expect(next).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(403);
    }
  });

  it('rejects with 403 when no user is attached', () => {
    const next: NextFunction = jest.fn();
    const response = buildResponse();
    requireRoleAtLeast('User')(buildRequest(), response, next);
    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(403);
  });

  it('rejects with 403 when role string is unknown', () => {
    const next: NextFunction = jest.fn();
    const response = buildResponse();
    requireRoleAtLeast('User')(
      buildRequest({ role: 'NotARealRole' as unknown as Role }),
      response,
      next
    );
    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(403);
  });
});

describe('hasRoleAtLeast (boolean)', () => {
  it('returns true when role meets the bar', () => {
    expect(hasRoleAtLeast('Admin', 'Admin')).toBe(true);
    expect(hasRoleAtLeast('Owner', 'Admin')).toBe(true);
  });

  it('returns false when role is below the bar', () => {
    expect(hasRoleAtLeast('User', 'Admin')).toBe(false);
    expect(hasRoleAtLeast('Moderator', 'Admin')).toBe(false);
  });

  it('returns false for undefined or unknown roles', () => {
    expect(hasRoleAtLeast(undefined, 'User')).toBe(false);
    expect(hasRoleAtLeast('NotARealRole', 'User')).toBe(false);
  });
});
