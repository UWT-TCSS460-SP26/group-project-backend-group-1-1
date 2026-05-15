import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { resolveLocalUser } from '../../auth/resolveLocalUser';

export const deleteRating = async (request: Request, response: Response): Promise<void> => {
  const { id } = request.params as unknown as { id: number };
  const user = request.user!;

  const authHeader = request.headers.authorization;
  const token = authHeader?.split(' ')[1]!;

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

    await prisma.rating.delete({
      where: { id },
    });

    response.status(204).send();
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Delete rating error:', error);
    response.status(500).json({ error: 'Failed to delete rating' });
  }
};
