import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
}

/**
 * DELETE /reviews/:id
 * Authenticated + ownership. Deletes a review the caller owns.
 */
export const deleteReview = async (
  request: AuthenticatedRequest,
  response: Response
): Promise<void> => {
  const id = Number(request.params.id);
  const user = request.user;

  if (!user?.sub) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

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

    // Only owner OR admin can delete
    if (review.userId !== Number(user.sub) && user.role !== 'admin') {
      response.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.review.delete({
      where: { id },
    });

    response.status(204).send();
  } catch (_error) {
    response.status(500).json({ error: 'Failed to delete review' });
  }
};