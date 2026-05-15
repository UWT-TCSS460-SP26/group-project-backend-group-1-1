import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

/**
 * POST /issues
 * Public bug-report submission.
 */
export const createIssue = async (request: Request, response: Response): Promise<void> => {
  const { title, description, stepsToReproduce, reporterEmail } = request.body;

  try {
    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        stepsToReproduce: stepsToReproduce || null,
        reporterEmail: reporterEmail || null,
      },
    });

    response.status(201).json(issue);
  } catch (_error) {
    response.status(500).json({ error: 'Failed to create issue' });
  }
};
