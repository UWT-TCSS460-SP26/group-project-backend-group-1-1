import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const addSubjectId = async (request: Request, response: Response): Promise<void> => {
  const user = request.user;

  if (!user?.sub) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: user.email },
      data: { subjectId: user.sub },
    });

    const { email: _email, ...userWithoutEmail } = updatedUser;

    response.status(200).json(userWithoutEmail);
  } catch {
    response.status(500).json({ error: 'Failed to add subjectId' });
  }
};
