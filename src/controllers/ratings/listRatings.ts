import { Request, Response } from 'express';

/**
 * GET /ratings/media/:mediaType/:tmdbId
 * Public. Returns ratings for a given TMDB identifier.
 *
 * TODO:
 *   - validate :mediaType in ('movie', 'tv')
 *   - parse :tmdbId as int
 *   - paginate (?page, ?limit) — decide default + max
 *   - team decides: raw list, aggregate (avg + count), or both
 */
export const listRatings = async (_request: Request, response: Response): Promise<void> => {
  response.status(501).json({ error: 'Not implemented' });
};
