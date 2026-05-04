import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { Prisma } from '../../generated/prisma/client';
import { resolveLocalUser } from '../../auth/resolveLocalUser';

export const createRating = async (request: Request, response: Response): Promise<void> => {
  const { tmdbId, mediaType, score } = request.body;
  const user = request.user;

  const authHeader = request.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token || !user?.sub) {
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
    const localUser = await resolveLocalUser(user.sub, token);

    const rating = await prisma.rating.create({
      data: {
        userId: localUser.id,
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

    // eslint-disable-next-line no-console
    console.error('Create rating error:', error);
    response.status(500).json({ error: 'Failed to create rating' });
  }
};
