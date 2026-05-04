import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { resolveLocalUser } from '../../auth/resolveLocalUser';

export const deleteRating = async (request: Request, response: Response): Promise<void> => {
  const id = Number(request.params.id);
  const user = request.user;

  const authHeader = request.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token || !user?.sub) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!Number.isInteger(id)) {
    response.status(400).json({ error: 'Invalid rating id' });
    return;
  }

  try {
    const localUser = await resolveLocalUser(user.sub, token);
    const existing = await prisma.rating.findUnique({ where: { id } });

    if (!existing) {
      response.status(404).json({ error: 'Rating not found' });
      return;
    }

    if (existing.userId !== localUser.id) {
      response.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.rating.delete({ where: { id } });

    response.status(204).send();
  } catch (_error) {
    response.status(500).json({ error: 'Failed to delete rating' });
  }
};
