import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { Prisma } from '../../generated/prisma/client';
import { resolveLocalUser } from '../../auth/resolveLocalUser';

/**
 * POST /reviews
 * Authenticated. Creates a review owned by req.user.
 */
export const createReview = async (request: Request, response: Response): Promise<void> => {
  const { tmdbId, mediaType, title, body } = request.body;
  const user = request.user!;

  const authHeader = request.headers.authorization;
  const token = authHeader?.split(' ')[1]!;

  try {
    const localUser = await resolveLocalUser(user.sub, token);

    const review = await prisma.review.create({
      data: {
        userId: localUser.id,
        tmdbId,
        mediaType,
        title: title || `Review of ${tmdbId}`,
        description: body,
      },
    });

    response.status(201).json(review);
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      response.status(409).json({ error: 'You have already reviewed this media item' });
    } else {
      // eslint-disable-next-line no-console
      console.error('Create review error:', error);
      response.status(500).json({ error: 'Failed to create review' });
    }
  }
};
