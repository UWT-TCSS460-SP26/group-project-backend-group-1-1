import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { formatAuthor } from '../../lib/author';

export const getReview = async (request: Request, response: Response): Promise<void> => {
  const { id } = request.params as unknown as { id: number };

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!review) {
      response.status(404).json({ error: 'Review not found' });
      return;
    }

    const { user, ...rest } = review;

    response.status(200).json({
      ...rest,
      author: formatAuthor(user),
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Get review error:', error);
    response.status(500).json({ error: 'Failed to fetch review' });
  }
};
