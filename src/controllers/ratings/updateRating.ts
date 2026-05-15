import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { resolveLocalUser } from '../../auth/resolveLocalUser';

export const updateRating = async (request: Request, response: Response): Promise<void> => {
  const { id } = request.params as unknown as { id: number };
  const { score } = request.body;
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

    const existingRating = await prisma.rating.findUnique({
      where: { id },
    });

    if (!existingRating) {
      response.status(404).json({ error: 'Rating not found' });
      return;
    }

    if (existingRating.userId !== localUser.id) {
      response.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updatedRating = await prisma.rating.update({
      where: { id },
      data: { score },
    });

    response.status(200).json(updatedRating);
  } catch (_error: unknown) {
    response.status(500).json({ error: 'Failed to update rating' });
  }
};
