import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { formatAuthor } from '../../lib/author';

const getReviewSchema = z.object({
  id: z.coerce.number().int().positive('Review ID must be a positive integer'),
});

/**
 * GET /reviews/:id
 * Public. Returns a single review by its primary key.
 */
export const getReview = async (request: Request, response: Response): Promise<void> => {
  const result = getReviewSchema.safeParse(request.params);

  if (!result.success) {
    response.status(400).json({ errors: result.error.flatten().fieldErrors });
    return;
  }

  const { id } = result.data;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!review) {
      response.status(404).json({ error: 'Review not found' });
      return;
    }

    const { user, ...rest } = review;
    response.json({ ...rest, author: formatAuthor(user) });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to fetch review' });
  }
};
