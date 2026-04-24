import { Request, Response } from 'express';

/**
 * POST /reviews
 * Authenticated. Creates a review owned by req.user.
 *
 * Body: { tmdbId: number, mediaType: 'movie' | 'tv', title?: string, body: string }
 * Response: 201 with the created review.
 *
 * TODO:
 *   - validate body
 *   - prisma.review.create with userId = req.user.sub
 */
export const createReview = async (_request: Request, response: Response): Promise<void> => {
  response.status(501).json({ error: 'Not implemented' });
};
