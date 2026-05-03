import { Router, Request, Response } from 'express';

// import { prisma } from '../lib/prisma';

const router = Router();

const TMDB_URL = 'https://api.themoviedb.org/3/movie';

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  original_language: string;
  vote_average: number;
  runtime: number;
  genres: TmdbGenre[];
}

/**
 * GET /movies/:id/details
 *
 * Flagship combined route: TMDB metadata + this community's aggregate
 * rating, recent reviews, and review count in a single response.
 *
 * Proposed response shape (team's call to refine):
 *   {
 *     ...tmdbMovieFields,
 *     community: {
 *       averageScore: number | null,
 *       reviewCount: number
 *     },
 *     recentReviews: Array<{
 *       id: number,
 *       title: string,
 *       description: string,
 *       createdAt: string
 *     }>
 *   }
 *
 * Open design questions for the team:
 *   - Inline aggregate vs. sibling field (currently inline)
 *   - How many recent reviews to include (default 5 below)
 *   - Zero-rating shape: nulls vs. zeros vs. omitted (currently nulls)
 *   - Public, authenticated, or both
 */
router.get('/movies/:id/details', async (request: Request, response: Response) => {
  const id = String(request.params.id);
  const language = (request.query.language as string) || 'en-US';

  if (!id) {
    return response.status(400).json({ error: 'Movie id is required' });
  }

  const token = process.env['API-KEY'];
  if (!token) {
    return response.status(500).json({ error: 'TMDB API key is not configured' });
  }

  const url = new URL(`${TMDB_URL}/${encodeURIComponent(id)}`);
  url.searchParams.set('language', language);

  try {
    const upstream = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
      },
    });

    if (!upstream.ok) {
      return response
        .status(upstream.status)
        .json({ error: `Upstream TMDB error: ${upstream.statusText}` });
    }

    const data = (await upstream.json()) as TmdbMovieDetails;

    // TODO: replace stub with real prisma aggregation/find.
    //
    // const aggregate = await prisma.rating.aggregate({
    //   where: { tmdbId: id, mediaType: 'movie' },
    //   _avg: { score: true },
    //   _count: { score: true },
    // });
    // const recentReviews = await prisma.review.findMany({
    //   where: { tmdbId: id, mediaType: 'movie' },
    //   orderBy: { createdAt: 'desc' },
    //   take: 5,
    //   select: { id: true, title: true, description: true, createdAt: true },
    // });
    const community = { averageScore: null as number | null, reviewCount: 0 };
    const recentReviews: Array<{
      id: number;
      title: string;
      description: string;
      createdAt: Date;
    }> = [];

    return response.json({
      id: data.id,
      title: data.title,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: data.release_date,
      language: data.original_language,
      rating: data.vote_average,
      runtime: data.runtime,
      genres: data.genres.map((genre) => genre.name),
      community,
      recentReviews,
    });
  } catch (err) {
    return response
      .status(502)
      .json({ error: 'Failed to reach TMDB', detail: (err as Error).message });
  }
});

export { router as movieDetailsRouter };
