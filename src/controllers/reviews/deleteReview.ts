import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { resolveLocalUser } from '../../auth/resolveLocalUser';

/**
 * DELETE /reviews/:id
 * Authenticated + ownership. Deletes a review the caller owns.
 */
export const deleteReview = async (request: Request, response: Response): Promise<void> => {
  const id = Number(request.params.id);
  const user = request.user;

  const authHeader = request.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token || !user?.sub) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!Number.isInteger(id)) {
    response.status(400).json({ error: 'Invalid review id' });
    return;
  }

  try {
    const localUser = await resolveLocalUser(user.sub, token);
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      response.status(404).json({ error: 'Review not found' });
      return;
    }

    // Only owner OR admin can delete
    if (review.userId !== localUser.id && user.role !== 'Admin') {
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
