import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { resolveLocalUser } from '../../auth/resolveLocalUser';
import { hasRoleAtLeast } from '../../middleware/requireAuth';

export const deleteReview = async (request: Request, response: Response): Promise<void> => {
  const { id } = request.params as unknown as { id: number };
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

    // Allowed if owner OR admin
    const isOwner = existingReview.userId === localUser.id;
    const isAdmin = hasRoleAtLeast(user.role, 'Admin');

    if (!isOwner && !isAdmin) {
      response.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.review.delete({
      where: { id },
    });

    response.status(204).send();
  } catch (_error: unknown) {
    response.status(500).json({ error: 'Failed to delete review' });
  }
};
