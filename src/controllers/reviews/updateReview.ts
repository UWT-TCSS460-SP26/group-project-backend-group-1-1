import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { resolveLocalUser } from '../../auth/resolveLocalUser';

export const updateReview = async (request: Request, response: Response): Promise<void> => {
  const { id } = request.params as unknown as { id: number };
  const { title, description } = request.body;
  const user = request.user;

  if (!user) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const authHeader = request.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const localUser = await resolveLocalUser(user.sub, token);

    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      response.status(404).json({ error: 'Review not found' });
      return;
    }

    if (existingReview.userId !== localUser.id) {
      response.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        title,
        description,
      },
    });

    response.json(updatedReview);
  } catch (_error) {
    response.status(500).json({ error: 'Failed to update review' });
  }
};
