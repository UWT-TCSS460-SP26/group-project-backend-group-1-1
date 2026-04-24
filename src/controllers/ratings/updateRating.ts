import { Request, Response } from 'express';

/**
 * PUT /ratings/:id
 * Authenticated + ownership. Updates a rating the caller owns.
 *
 * TODO:
 *   - load rating by id, 404 if missing
 *   - if rating.userId !== req.user.sub → 403
 *   - validate body, prisma.rating.update
 */
export const updateRating = async (_request: Request, response: Response): Promise<void> => {
  response.status(501).json({ error: 'Not implemented' });
};
