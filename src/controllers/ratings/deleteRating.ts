import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const deleteRating = async (request: Request, response: Response): Promise<void> => {
  const id = Number(request.params.id);
  const user = request.user;

  if (!user?.sub) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!Number.isInteger(id)) {
    response.status(400).json({ error: 'Invalid rating id' });
    return;
  }

  try {
    const existing = await prisma.rating.findUnique({ where: { id } });

    if (!existing) {
      response.status(404).json({ error: 'Rating not found' });
      return;
    }

    if (existing.userId !== Number(user.sub)) {
      response.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.rating.delete({ where: { id } });

    response.status(204).send();
  } catch (_error) {
    response.status(500).json({ error: 'Failed to delete rating' });
  }
};
