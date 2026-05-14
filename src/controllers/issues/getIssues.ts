import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

/**
 * GET /issues
 *
 * Admin-gated: Fetches a paginated list of issues.
 * Supports filtering by status and sorting by newest first.
 *
 * Query Params:
 *  - page: number (default 1)
 *  - limit: number (default 10, max 50)
 *  - status: string (optional filtering by OPEN, CLOSED, etc.)
 */
export const getIssues = async (request: Request, response: Response): Promise<void> => {
  // Pagination logic
  const page = Number(request.query.page) || 1;
  const limit = Math.min(Number(request.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  // Filtering logic
  const status = request.query.status as string | undefined;
  const allowedStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX', 'DUPLICATE'];

  if (status && !allowedStatuses.includes(status)) {
    response
      .status(400)
      .json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    return;
  }

  const where = status ? { status } : {};

  try {
    // Fetch data and total count in parallel
    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // Newest first by default
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
