import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { resolveLocalUser } from '../../auth/resolveLocalUser';

/**
 * GET /reviews/me
 *
 * Authenticated: returns the current user's own reviews.
 * Uses request.user.sub from the verified JWT.
 */
export const getMyReviews = async (request: Request, response: Response): Promise<void> => {
  const user = request.user;

  const authHeader = request.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token || !user?.sub) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const page = Number(request.query.page) || 1;
  const limit = Math.min(Number(request.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    response.status(400).json({ error: 'Invalid pagination values' });
    return;
  }

  try {
    const localUser = await resolveLocalUser(user.sub, token);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          userId: localUser.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: {
          userId: localUser.id,
        },
      }),
    ]);

    response.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      results: reviews,
    });
  } catch (_error) {
    response.status(500).json({
      error: 'Failed to fetch reviews',
    });
  }
};
