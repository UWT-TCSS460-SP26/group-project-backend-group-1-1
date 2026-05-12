import { Request, Response, NextFunction, RequestHandler } from 'express';
import { expressjwt, UnauthorizedError, Request as JwtRequest } from 'express-jwt';
import { expressJwtSecret, GetVerificationKey } from 'jwks-rsa';
import { prisma } from '../lib/prisma';

export type Role = 'User' | 'Moderator' | 'Admin' | 'SuperAdmin' | 'Owner';

const ROLE_RANK: Record<Role, number> = {
  User: 0,
  Moderator: 1,
  Admin: 2,
  SuperAdmin: 3,
  Owner: 4,
};

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  role: Role;
  raw: Record<string, unknown>;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express type augmentation
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Build the JWKS-backed verifier lazily so the module can be imported
// in test environments where AUTH_ISSUER / API_AUDIENCE aren't set and
// requireAuth is mocked entirely.
let _verifyJwt: RequestHandler | undefined;
function buildVerifyJwt(): RequestHandler {
  if (_verifyJwt) return _verifyJwt;
  const issuer = process.env.AUTH_ISSUER;
  const audience = process.env.API_AUDIENCE;
  if (!issuer || !audience) {
    throw new Error('AUTH_ISSUER and API_AUDIENCE must be set');
  }
  _verifyJwt = expressjwt({
    secret: expressJwtSecret({
      jwksUri: `${issuer}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    }) as GetVerificationKey,
    audience,
    issuer,
    algorithms: ['RS256'],
  }) as unknown as RequestHandler;
  return _verifyJwt;
}

const verifyJwt: RequestHandler = (request, response, next) => {
  try {
    buildVerifyJwt()(request, response, next);
  } catch (err) {
    next(err);
  }
};

const isRole = (value: unknown): value is Role => typeof value === 'string' && value in ROLE_RANK;

const attachUser: RequestHandler = async (request, _response, next) => {
  const auth = (request as JwtRequest).auth as
    | { sub?: string; email?: string; role?: string; [key: string]: unknown }
    | undefined;

  if (auth?.sub) {
    try {
      // Look up the user in our local database to see if they have an elevated role.
      const dbUser = await prisma.user.findUnique({
        where: { subjectId: auth.sub },
        select: { role: true },
      });

      const roleFromDb = dbUser?.role;

      request.user = {
        sub: auth.sub,
        email: auth.email,
        // Source of truth: 1. DB Role, 2. JWT Role, 3. Default 'User'
        role: isRole(roleFromDb) ? roleFromDb : isRole(auth.role) ? auth.role : 'User',
        raw: auth as Record<string, unknown>,
      };
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
};

const handleAuthError = (
  err: unknown,
  _request: Request,
  response: Response,
  next: NextFunction
): void => {
  if (err instanceof UnauthorizedError) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next(err);
};

/**
 * The authentication chain: verify the JWT via JWKS, attach the typed
 * user to request.user, and translate any verification error to a 401.
 *
 * Use as middleware:
 *   router.post('/protected', requireAuth, handler);
 */
export const requireAuth: RequestHandler[] = [
  verifyJwt,
  attachUser,
  handleAuthError as unknown as RequestHandler,
];

/**
 * Exact-match role gate. Use after requireAuth.
 *
 *   router.delete('/admin-only', requireAuth, requireRole('Admin'), handler);
 */
export const requireRole =
  (role: Role): RequestHandler =>
  (request, response, next) => {
    if (request.user?.role !== role) {
      response.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };

/**
 * Hierarchy role gate. Accepts the named role or any role above it.
 *
 *   router.post('/triage', requireAuth, requireRoleAtLeast('Moderator'), handler);
 */
export const requireRoleAtLeast =
  (min: Role): RequestHandler =>
  (request, response, next) => {
    const userRole = request.user?.role;
    if (!userRole || !(userRole in ROLE_RANK) || ROLE_RANK[userRole] < ROLE_RANK[min]) {
      response.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };

/**
 * Boolean variant for in-handler checks (e.g. branching on role inside
 * a single endpoint without a separate route).
 */
export const hasRoleAtLeast = (role: Role | string | undefined, min: Role): boolean => {
  if (!role || !(role in ROLE_RANK)) return false;
  return ROLE_RANK[role as Role] >= ROLE_RANK[min];
};
