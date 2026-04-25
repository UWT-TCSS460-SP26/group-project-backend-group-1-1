import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { Prisma } from '../../generated/prisma/client';

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

  const userId = parseInt(request.user!.sub, 10);
  if (isNaN(userId)) {
    response.status(401).json({ error: 'Invalid user ID' });
    return;
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId,
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
      response.status(500).json({ error: 'Failed to create review' });
    }
  }
};
