import { Request, Response } from 'express';

/**
 * DELETE /reviews/:id
 * Authenticated. Author can delete their own review; admins can delete any.
 *
 * TODO:
 *   - load review by id, 404 if missing
 *   - allow if review.userId === req.user.sub OR req.user.role === 'admin'
 *   - else 403
 *   - team decides: hard delete or soft delete (add deletedAt)
 */
export const deleteReview = async (_request: Request, response: Response): Promise<void> => {
  response.status(501).json({ error: 'Not implemented' });
};
