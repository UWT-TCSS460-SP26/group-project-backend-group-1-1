import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { formatAuthor } from '../../lib/author';

/**
 * GET /reviews/media/:mediaType/:tmdbId
 * Public. Returns reviews for a given TMDB identifier.
 */
export const listReviews = async (request: Request, response: Response): Promise<void> => {
  const mediaType = request.params.mediaType as string;
  const tmdbId = request.params.tmdbId as string;

  const page = Number(request.query.page) || 1;
  const limit = Number(request.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!['movie', 'tv'].includes(mediaType)) {
    response.status(400).json({ error: 'Invalid media type' });
    return;
  }

  if (!tmdbId) {
    response.status(400).json({ error: 'tmdbId is required' });
    return;
  }

  if (page < 1 || limit < 1 || limit > 50) {
    response.status(400).json({ error: 'Invalid pagination values' });
    return;
  }

  try {
    const reviews = await prisma.review.findMany({
      where: {
        tmdbId,
        mediaType,
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
  } catch (_error) {
    response.status(500).json({ error: 'Failed to fetch reviews' });
  }
};
