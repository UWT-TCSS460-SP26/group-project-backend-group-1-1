import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { formatAuthor } from '../../lib/author';

export const getRating = async (request: Request, response: Response): Promise<void> => {
  const { id } = request.params as unknown as { id: number };

  try {
    const rating = await prisma.rating.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!rating) {
      response.status(404).json({ error: 'Rating not found' });
      return;
    }

    const { user, ...rest } = rating;

    response.status(200).json({
      ...rest,
      author: formatAuthor(user),
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Get rating error:', error);
    response.status(500).json({ error: 'Failed to fetch rating' });
  }
};
