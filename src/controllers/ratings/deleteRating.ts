import { Request, Response } from 'express';

/**
 * DELETE /ratings/:id
 * Authenticated + ownership. Deletes a rating the caller owns.
 *
 * TODO:
 *   - load rating by id, 404 if missing
 *   - if rating.userId !== req.user.sub → 403
 *   - prisma.rating.delete, respond 204
 */
export const deleteRating = async (_request: Request, response: Response): Promise<void> => {
  response.status(501).json({ error: 'Not implemented' });
};
