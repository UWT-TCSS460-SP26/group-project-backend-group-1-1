import { Request, Response } from 'express';

/**
 * GET /reviews/:id
 * Public. Returns a single review by its primary key.
 *
 * TODO:
 *   - parse :id as int, 400 if invalid
 *   - prisma.review.findUnique
 *   - 404 if not found
 */
export const getReview = async (_request: Request, response: Response): Promise<void> => {
  response.status(501).json({ error: 'Not implemented' });
};
