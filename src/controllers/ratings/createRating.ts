import { Request, Response } from 'express';

/**
 * POST /ratings
 * Authenticated. Creates a rating owned by req.user.
 *
 * Body: { tmdbId: number, mediaType: 'movie' | 'tv', score: number }
 * Response: 201 with the created rating.
 *
 * TODO:
 *   - validate body (tmdbId int, mediaType in enum, score in range)
 *   - prisma.rating.create with userId = req.user.sub
 *   - decide re-rate behavior (upsert vs error) per team decision
 */
export const createRating = async (_request: Request, response: Response): Promise<void> => {
  response.status(501).json({ error: 'Not implemented' });
};
