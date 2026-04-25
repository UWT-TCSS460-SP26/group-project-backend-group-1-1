import { Request, Response } from 'express';

/**
 * GET /ratings/:id
 * Public. Returns a single rating by its primary key.
 *
 * TODO:
 *   - parse :id as int, 400 if invalid
 *   - prisma.rating.findUnique
 *   - 404 if not found
 */
export const getRating = async (_request: Request, response: Response): Promise<void> => {
  response.status(501).json({ error: 'Not implemented' });
};
