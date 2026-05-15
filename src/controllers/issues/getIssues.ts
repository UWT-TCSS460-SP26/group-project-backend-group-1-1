import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

/**
 * GET /issues
 * Admin-gated: Fetches a paginated list of issues.
 */
export const getIssues = async (request: Request, response: Response): Promise<void> => {
  const page = Number(request.query.page) || 1;
  const limit = Number(request.query.limit) || 10;
  const status = request.query.status as string | undefined;
  
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  try {
    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.issue.count({ where }),
    ]);

    response.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      results: issues,
    });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to fetch issues' });
  }
};
