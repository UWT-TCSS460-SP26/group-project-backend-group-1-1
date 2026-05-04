import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { Prisma } from '../../generated/prisma/client';
import { resolveLocalUser } from '../../auth/resolveLocalUser';

const createReviewSchema = z.object({
  tmdbId: z.string().min(1),
  mediaType: z.enum(['movie', 'tv']),
  title: z.string().trim().optional(),
  body: z
    .string()
    .trim()
    .min(1, 'Review body cannot be empty')
    .max(5000, 'Review body cannot exceed 5000 characters'),
});

/**
 * POST /reviews
 * Authenticated. Creates a review owned by req.user.
 *
 * Body: { tmdbId: string, mediaType: 'movie' | 'tv', title?: string, body: string }
 * Response: 201 with the created review.
 */
export const createReview = async (request: Request, response: Response): Promise<void> => {
  const parsed = createReviewSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { tmdbId, mediaType, title, body } = parsed.data;

  const authHeader = request.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token || !request.user?.sub) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const localUser = await resolveLocalUser(request.user.sub, token);

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
