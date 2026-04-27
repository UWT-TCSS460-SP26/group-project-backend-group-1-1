import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const updateRating = async (request: Request, response: Response): Promise<void> => {
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

  const { score } = request.body as { score?: unknown };

  if (!Number.isInteger(score)) {
    response.status(400).json({ error: 'Invalid rating fields' });
    return;
  }

  if ((score as number) < 0 || (score as number) > 10) {
    response.status(400).json({ error: 'Score must be between 0 and 10' });
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

    const updated = await prisma.rating.update({
      where: { id },
      data: { score: score as number },
    });

    response.status(200).json(updated);
  } catch (_error) {
    response.status(500).json({ error: 'Failed to update rating' });
  }
};
