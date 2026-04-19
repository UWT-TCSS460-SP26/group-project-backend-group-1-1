import { Router, Request, Response } from 'express';

const router = Router();

// Base TMDB endpoint for TV details
const TMDB_URL = 'https://api.themoviedb.org/3/tv';

// Genre type
interface TmdbGenre {
  id: number;
  name: string;
}

// TV details shape from TMDB
interface TmdbTVDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  original_language: string;
  vote_average: number;
  number_of_seasons: number;
  number_of_episodes: number;
  genres: TmdbGenre[];
  status: string;
}

/**
 * GET /tv/:id
 *
 * Fetches detailed TV show information from TMDB
 */
router.get('/tv/:id', async (request: Request, response: Response) => {
  const id = request.params.id;
  const language = (request.query.language as string) || 'en-US';

  if (!id) {
    return response.status(400).json({ error: 'TV show id is required' });
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

    const data = (await upstream.json()) as TmdbTVDetails;

    return response.json({
      id: data.id,
      title: data.name,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      first_air_date: data.first_air_date,
      language: data.original_language,
      rating: data.vote_average,
      number_of_seasons: data.number_of_seasons,
      number_of_episodes: data.number_of_episodes,
      status: data.status,
      genres: data.genres.map((g) => g.name),
    });
  } catch (err) {
    return response
      .status(502)
      .json({ error: 'Failed to reach TMDB', detail: (err as Error).message });
  }
});


export { router as tvIDRouter };