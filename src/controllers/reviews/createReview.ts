import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const createReview = async (request: Request, response: Response): Promise<void> => {
  const { tmdbId, mediaType, title, description } = request.body as {
    tmdbId?: unknown;
    mediaType?: unknown;
    title?: unknown;
    description?: unknown;
  };
  const user = request.user;

  if (!user?.sub) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (
    typeof tmdbId !== 'string' ||
    typeof mediaType !== 'string' ||
    !['movie', 'tv'].includes(mediaType) ||
    typeof title !== 'string' ||
    typeof description !== 'string' ||
    title.trim().length === 0 ||
    description.trim().length === 0
  ) {
    response.status(400).json({ error: 'Invalid review fields' });
    return;
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId: Number(user.sub),
        tmdbId,
        mediaType,
        title,
        description,
      },
    });

    response.status(201).json(review);
  } catch (_error) {
    response.status(500).json({ error: 'Failed to create review' });
  }
};
