import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { formatAuthor } from '../../lib/author';

/**
 * GET /reviews/media/:mediaType/:tmdbId
 * Public. Returns reviews for a given TMDB identifier.
 */
export const listReviews = async (request: Request, response: Response): Promise<void> => {
  const { mediaType, tmdbId } = request.params;

  // Cast query parameters to numbers safely
  const page = Number(request.query.page) || 1;
  const limit = Number(request.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const reviews = await prisma.review.findMany({
      where: {
        tmdbId: tmdbId as string,
        mediaType: mediaType as 'movie' | 'tv',
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      include: { user: true },
    });

    response.json({
      page,
      limit,
      results: reviews.map(({ user, ...review }) => ({
        ...review,
        author: formatAuthor(user),
      })),
    });
  } catch (_) {
    response.status(500).json({ error: 'Failed to fetch reviews' });
  }
};
