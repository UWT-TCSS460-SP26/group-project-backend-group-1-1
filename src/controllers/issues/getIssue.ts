import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

/**
 * GET /issues/:id
 * Admin-gated: Fetches a single issue by its numeric ID.
 */
export const getIssue = async (request: Request, response: Response): Promise<void> => {
  const { id } = request.params as unknown as { id: number };

  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!issue) {
      response.status(404).json({ error: 'Issue not found' });
      return;
    }

    response.status(200).json(issue);
  } catch (_error) {
    response.status(500).json({ error: 'Failed to fetch issue' });
  }
};
