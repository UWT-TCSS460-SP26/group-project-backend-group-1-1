import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { formatAuthor } from '../../lib/author';

export const getRating = async (request: Request, response: Response): Promise<void> => {
  const id = Number(request.params.id);

  if (!Number.isInteger(id)) {
    response.status(400).json({ error: 'Invalid rating id' });
    return;
  }

  try {
    const rating = await prisma.rating.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!rating) {
      response.status(404).json({ error: 'Rating not found' });
      return;
    }

    const { user, ...rest } = rating;
    response.status(200).json({ ...rest, author: formatAuthor(user) });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to fetch rating' });
  }
};
