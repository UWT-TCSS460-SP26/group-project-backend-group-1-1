import { Request, Response } from 'express';

/**
 * PUT /reviews/:id
 * Authenticated + ownership. Updates a review the caller owns.
 *
 * TODO:
 *   - load review by id, 404 if missing
 *   - if review.userId !== req.user.sub → 403
 *   - validate body, prisma.review.update
 */
export const updateReview = async (_request: Request, response: Response): Promise<void> => {
  response.status(501).json({ error: 'Not implemented' });
};
