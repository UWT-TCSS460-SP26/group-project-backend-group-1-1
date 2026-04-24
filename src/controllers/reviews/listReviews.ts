import { Request, Response } from 'express';

/**
 * GET /reviews/media/:mediaType/:tmdbId
 * Public. Returns reviews for a given TMDB identifier.
 *
 * TODO:
 *   - validate :mediaType in ('movie', 'tv')
 *   - parse :tmdbId as int
 *   - paginate (?page, ?limit) with sane defaults
 *   - team decides sort order (newest first? by score?)
 */
export const listReviews = async (_request: Request, response: Response): Promise<void> => {
  response.status(501).json({ error: 'Not implemented' });
};
