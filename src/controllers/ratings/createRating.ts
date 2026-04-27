import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { Prisma } from '../../generated/prisma/client';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
}

export const createRating = async (
  request: AuthenticatedRequest,
  response: Response
): Promise<void> => {
  const { tmdbId, mediaType, score } = request.body;
  const user = request.user;

  if (!user?.sub) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (
    typeof tmdbId !== 'string' ||
    !['movie', 'tv'].includes(mediaType) ||
    !Number.isInteger(score)
  ) {
    response.status(400).json({ error: 'Invalid rating fields' });
    return;
  }

  if (score < 0 || score > 10) {
    response.status(400).json({ error: 'Score must be between 0 and 10' });
    return;
  }

  try {
    const rating = await prisma.rating.create({
      data: {
        userId: Number(user.sub),
        tmdbId,
        mediaType,
        score,
      },
    });

    response.status(201).json(rating);
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      response.status(409).json({ error: 'You have already rated this media item' });
      return;
    }

    response.status(500).json({ error: 'Failed to create rating' });
  }
};
