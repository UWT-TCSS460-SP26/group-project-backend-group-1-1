import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

/**
 * GET /issues/:id
 *
 * Admin-gated: Fetches a single issue by its numeric ID.
 * Returns 404 if the issue doesn't exist, or 400 if the ID is invalid.
 */
export const getIssue = async (request: Request, response: Response): Promise<void> => {
  const { id } = request.params;

  // Validate that ID is a number
  const issueId = parseInt(String(id), 10);
  if (isNaN(issueId)) {
    response.status(400).json({ error: 'Invalid issue ID' });
    return;
  }

  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      response.status(404).json({ error: 'Issue not found' });
      return;
    }

    response.status(200).json(issue);
  } catch (_error) {
    // Log error if needed, for now just return 500
    response.status(500).json({ error: 'Failed to fetch issue' });
  }
};
