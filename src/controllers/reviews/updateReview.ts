import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
}

export const updateReview = async (
  request: AuthenticatedRequest,
  response: Response
): Promise<void> => {
  const id = Number(request.params.id);
  const user = request.user;
  const { title, description } = request.body;

  if (!user?.sub) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!Number.isInteger(id)) {
    response.status(400).json({ error: 'Invalid review id' });
    return;
  }

  if (title !== undefined && typeof title !== 'string') {
    response.status(400).json({ error: 'Invalid title' });
    return;
  }

  if (description !== undefined && typeof description !== 'string') {
    response.status(400).json({ error: 'Invalid description' });
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

    if (review.userId !== Number(user.sub)) {
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