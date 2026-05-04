import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const addSubjectId = async (request: Request, response: Response): Promise<void> => {
  const user = request.user

  if (!user?.sub) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: user.email },
      data: { subjectId: user.sub },
    });

    response.status(200).json(updatedUser);
  } catch {
    response.status(500).json({ error: 'Failed to add subjectId' });
  }
};