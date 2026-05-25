import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getEnrichedMovieOrShow = async (
  request: Request,
  response: Response
): Promise<void> => {
  const mediaType = String(request.params.mediaType);
  const id = String(request.params.id);

  if (!['movie', 'tv'].includes(mediaType)) {
    response.status(400).json({ error: 'Invalid media type' });
    return;
  }

  try {
    // 1. Fetch TMDB data
    const tmdbResponse = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env['API-KEY']}`,      },
    });

    const tmdbData = (await tmdbResponse.json());    
    // 2. Fetch ratings
    const ratings = await prisma.rating.aggregate({
      where: { tmdbId: String(id), mediaType },
      _avg: { score: true },
      _count: true,
    });

    // 3. Fetch reviews
    const reviews = await prisma.review.findMany({
      where: { tmdbId: String(id), mediaType },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Combine response
    response.json({
      tmdb: tmdbData,
      ratings: {
        average: ratings._avg.score ?? 0,
        count: ratings._count,
      },
      reviews,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Failed to fetch enriched data' });
  }
};
