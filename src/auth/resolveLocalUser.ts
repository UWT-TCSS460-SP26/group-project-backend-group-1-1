import { prisma } from '../lib/prisma';

interface UserInfoResponse {
  sub: string;
  email?: string;
  username?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  role?: string;
}

/**
 * Returns the local User row corresponding to a verified JWT subject.
 *
 * Fast path: if a row already exists keyed by subjectId, return it
 * without any network call.
 *
 * Slow path: on first request for a previously-unseen subject, fetch
 * enriched profile fields from {AUTH_ISSUER}/v2/oauth/userinfo using
 * the same bearer token, upsert a local row, and return it.
 *
 * Public routes (browse, search, public GETs) should NOT call this —
 * the upsert is meaningless for unauthenticated traffic.
 */
export async function resolveLocalUser(subjectId: string, bearerToken: string) {
  const existing = await prisma.user.findUnique({ where: { subjectId } });
  if (existing) return existing;

  const issuer = process.env.AUTH_ISSUER;
  if (!issuer) {
    throw new Error('AUTH_ISSUER is not configured');
  }

  const response = await fetch(`${issuer}/v2/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  if (!response.ok) {
    throw new Error(`userinfo fetch failed: ${response.status} ${response.statusText}`);
  }
  const info = (await response.json()) as UserInfoResponse;

  // Sensible fallbacks when fields are missing from the userinfo response.
  const username = info.preferred_username || info.username || info.email || subjectId;
  const email = info.email || `${subjectId}@unknown.local`;

  return prisma.user.upsert({
    where: { subjectId },
    update: {
      email,
      username,
      firstName: info.given_name ?? null,
      lastName: info.family_name ?? null,
    },
    create: {
      subjectId,
      username,
      email,
      firstName: info.given_name ?? null,
      lastName: info.family_name ?? null,
      role: info.role ?? 'User',
    },
  });
}
