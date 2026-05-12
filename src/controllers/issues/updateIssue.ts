import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { Prisma } from '../../generated/prisma/client';

const updateIssueSchema = z
  .object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX', 'DUPLICATE']).optional(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    stepsToReproduce: z.string().trim().optional(),
  })
  .strict();

/**
 * PATCH /issues/:id
 *
 * Admin-gated: Updates one or more fields of a bug report.
 * Returns 404 if the issue doesn't exist, 400 for invalid ID or data.
 */
export const updateIssue = async (request: Request, response: Response): Promise<void> => {
  const { id } = request.params;

  // Validate ID
  const issueId = parseInt(String(id), 10);
  if (isNaN(issueId)) {
    response.status(400).json({ error: 'Invalid issue ID' });
    return;
  }

  // Validate Body
  const result = updateIssueSchema.safeParse(request.body);
  if (!result.success) {
    response.status(400).json({
      error: 'Invalid update data',
      details: result.error.flatten().fieldErrors,
    });
    return;
  }

  const updateData = result.data;

  // Check if there's actually anything to update
  if (Object.keys(updateData).length === 0) {
    try {
      const issue = await prisma.issue.findUnique({ where: { id: issueId } });
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
      where: { id: issueId },
      data: updateData,
    });

    response.status(200).json(updatedIssue);
  } catch (error) {
    // P2025 is Prisma's code for Record Not Found
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      response.status(404).json({ error: 'Issue not found' });
      return;
    }

    response.status(500).json({ error: 'Failed to update issue' });
  }
};
