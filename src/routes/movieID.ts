import { Router, Request, Response } from 'express';

const router = Router();

// Base TMDB endpoint for movie details
const TMDB_URL = 'https://api.themoviedb.org/3/movie';

// Represents a movie genre from TMDB
interface TmdbGenre {
  id: number;
  name: string;
}

// Represents only the fields we need from TMDB's movie details response
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
 * GET /movies/:id
 *
 * This route fetches detailed movie data from TMDB
 * and returns a simplified version for our frontend.
 */
router.get('/movies/:id', async (request: Request, response: Response) => {
  const id = request.params.id;

  // Default language if not provided
  const language = (request.query.language as string) || 'en-US';

  // Validate required movie id
  if (!id) {
    return response.status(400).json({ error: 'Movie id is required' });
  }

  // Get TMDB API token from environment
  const token = process.env['API-KEY'];
  if (!token) {
    return response.status(500).json({ error: 'TMDB API key is not configured' });
  }

  // Construct TMDB request URL safely
  const url = new URL(`${TMDB_URL}/${encodeURIComponent(id)}`);
  url.searchParams.set('language', language);

  try {
    // Make request to TMDB
    const upstream = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`, // secure authentication
        accept: 'application/json',
      },
    });

    // Handle TMDB errors
    if (!upstream.ok) {
      return response
        .status(upstream.status)
        .json({ error: `Upstream TMDB error: ${upstream.statusText}` });
    }

    // Parse TMDB response
    const data = (await upstream.json()) as TmdbMovieDetails;

    // Transform TMDB response → our API schema
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
    });
  } catch (err) {
    // Handle network or unexpected failures
    return response
      .status(502)
      .json({ error: 'Failed to reach TMDB', detail: (err as Error).message });
  }
});

// Export router for use in app.ts
export { router as movieIDRouter };