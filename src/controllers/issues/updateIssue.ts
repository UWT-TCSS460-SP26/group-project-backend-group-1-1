import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { Prisma } from '../../generated/prisma/client';

/**
 * PATCH /issues/:id
 * Admin-gated: Updates one or more fields of a bug report.
 */
export const updateIssue = async (request: Request, response: Response): Promise<void> => {
  const { id } = request.params as unknown as { id: number };
  const updateData = request.body;

  // Check if there's actually anything to update
  if (Object.keys(updateData).length === 0) {
    try {
      const issue = await prisma.issue.findUnique({ where: { id } });
      if (!issue) {
        response.status(404).json({ error: 'Issue not found' });
        return;
      }
      response.status(200).json(issue);
      return;
    } catch (_error) {
      response.status(500).json({ error: 'Failed to fetch issue' });
      return;
    }
  }

  try {
    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: updateData,
    });

    response.status(200).json(updatedIssue);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      response.status(404).json({ error: 'Issue not found' });
      return;
    }

    response.status(500).json({ error: 'Failed to update issue' });
  }
};
