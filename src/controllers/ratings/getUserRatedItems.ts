import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getUserRatedItems = async (request: Request, response: Response): Promise<void> => {
  try {
    const subjectId = request.user?.sub;

    if (!subjectId) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { subjectId },
    });

    if (!user) {
      response.status(404).json({ error: 'User not found' });
      return;
    }

    const ratings = await prisma.rating.findMany({
      where: { userId: user.id },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const enrichedRatings = await Promise.all(
      ratings.map(async (rating) => {
        try {
          const tmdbResponse = await fetch(
            `https://api.themoviedb.org/3/${rating.mediaType}/${rating.tmdbId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!tmdbResponse.ok) {
            return {
              ...rating,
              author: {
                id: rating.user.id,
                displayName:
                  rating.user.firstName && rating.user.lastName
                    ? `${rating.user.firstName} ${rating.user.lastName}`
                    : rating.user.username,
              },
              tmdb: null,
              tmdbMissing: true,
            };
          }

          const tmdbData = await tmdbResponse.json();

          return {
            ...rating,
            author: {
              id: rating.user.id,
              displayName:
                rating.user.firstName && rating.user.lastName
                  ? `${rating.user.firstName} ${rating.user.lastName}`
                  : rating.user.username,
            },
            tmdb: tmdbData,
            tmdbMissing: false,
          };
        } catch {
          return {
            ...rating,
            author: {
              id: rating.user.id,
              displayName:
                rating.user.firstName && rating.user.lastName
                  ? `${rating.user.firstName} ${rating.user.lastName}`
                  : rating.user.username,
            },
            tmdb: null,
            tmdbMissing: true,
          };
        }
      })
    );

    response.status(200).json(enrichedRatings);
  } catch {
    response.status(500).json({
      error: 'Failed to fetch user rated items',
    });
  }
};
