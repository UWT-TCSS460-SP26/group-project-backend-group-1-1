import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

/**
 * GET /ratings/media/:mediaType/:tmdbId
 * Public. Returns ratings for a given TMDB identifier.
 *
 * TODO:
 *   - validate :mediaType in ('movie', 'tv')
 *   - parse :tmdbId as int
 *   - paginate (?page, ?limit) — decide default + max
 *   - team decides: raw list, aggregate (avg + count), or both
 */
export const listRatings = async (request: Request, response: Response): Promise<void> => {
  const mediaType = String(request.params.mediaType);
  const tmdbId = String(request.params.tmdbId);

  if (mediaType !== 'movie' && mediaType !== 'tv') {
    response.status(400).json({ error: 'Invalid mediaType' });
    return;
  }

  if (!tmdbId) {
    response.status(400).json({ error: 'tmdbId is required' });
    return;
  }

  const page = Number(request.query.page) || 1;
  const limit = Math.min(Number(request.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  try {
    const ratings = await prisma.rating.findMany({
      where: { mediaType, tmdbId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const aggregate = await prisma.rating.aggregate({
      where: { mediaType, tmdbId },
      _avg: { score: true },
      _count: true,
    });

    response.status(200).json({
      page,
      limit,
      total: aggregate._count,
      averageScore: aggregate._avg.score ?? 0,
      results: ratings,
    });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to fetch ratings' });
  }
};
