import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getMostReviewed = async (request: Request, response: Response): Promise<void> => {
  try {
    const limit = Number(request.query.limit) || 10;

    const groupedRatings = await prisma.rating.groupBy({
      by: ['tmdbId', 'mediaType'],
      _count: {
        score: true,
      },
      orderBy: {
        _count: {
          score: 'desc',
        },
      },
      take: limit,
    });

    const enrichedResults = await Promise.all(
      groupedRatings.map(async (item) => {
        try {
          const tmdbResponse = await fetch(
            `https://api.themoviedb.org/3/${item.mediaType}/${item.tmdbId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!tmdbResponse.ok) {
            return {
              ...item,
              tmdb: null,
              tmdbMissing: true,
            };
          }

          const tmdbData = await tmdbResponse.json();

          return {
            ...item,
            tmdb: tmdbData,
            tmdbMissing: false,
          };
        } catch {
          return {
            ...item,
            tmdb: null,
            tmdbMissing: true,
          };
        }
      })
    );

    response.status(200).json(enrichedResults);
  } catch {
    response.status(500).json({
      error: 'Failed to fetch most reviewed items',
    });
  }
};
