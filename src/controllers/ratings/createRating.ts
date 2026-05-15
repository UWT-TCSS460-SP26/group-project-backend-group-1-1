import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { Prisma } from '../../generated/prisma/client';
import { resolveLocalUser } from '../../auth/resolveLocalUser';

export const createRating = async (request: Request, response: Response): Promise<void> => {
  const { tmdbId, mediaType, score } = request.body;
  const user = request.user!;

  const authHeader = request.headers.authorization;
  const token = authHeader?.split(' ')[1]!;

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
