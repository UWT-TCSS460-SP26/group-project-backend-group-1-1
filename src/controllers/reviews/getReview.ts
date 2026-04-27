import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getReview = async (request: Request, response: Response): Promise<void> => {
  const id = Number(request.params.id);

  if (!Number.isInteger(id)) {
    response.status(400).json({ error: 'Invalid review id' });
    return;
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      response.status(404).json({ error: 'Review not found' });
      return;
    }

    response.status(200).json(review);
  } catch (_error) {
    response.status(500).json({ error: 'Failed to fetch review' });
  }
};
