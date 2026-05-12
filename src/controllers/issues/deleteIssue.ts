import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { Prisma } from '../../generated/prisma/client';

/**
 * DELETE /issues/:id
 *
 * Admin-gated: Deletes a bug report by its numeric ID.
 * Returns 404 if the issue doesn't exist, or 400 if the ID is invalid.
 */
export const deleteIssue = async (request: Request, response: Response): Promise<void> => {
  const { id } = request.params;

  const issueId = parseInt(String(id), 10);
  if (isNaN(issueId)) {
    response.status(400).json({ error: 'Invalid issue ID' });
    return;
  }

  try {
    await prisma.issue.delete({
      where: { id: issueId },
    });

    response.status(200).json({ message: 'Issue deleted successfully' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      response.status(404).json({ error: 'Issue not found' });
      return;
    }

    response.status(500).json({ error: 'Failed to delete issue' });
  }
};
