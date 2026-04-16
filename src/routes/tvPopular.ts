import { Router, Request, Response } from 'express';

const router = Router();

// Upstream TMDB endpoint this route proxies.
const TMDB_URL = 'https://api.themoviedb.org/3/discover/tv';

// Subset of the TMDB TV object we care about.
interface TmdbTV {
  id: number;
  original_name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  original_language: string;
}

interface TmdbResponse {
  results: TmdbTV[];
}

/**
 * GET /tv/popular
 */
router.get('/tv/popular', async (request: Request, response: Response) => {
  // --- 1. Parse & default client query params --------------------------------
  const language = (request.query.language as string) || 'en-US';
  const page = (request.query.page as string) || '1';

  // --- 2. Read the upstream credential from env ------------------------------
  const token = process.env['API-KEY'];
  if (!token) {
    return response.status(500).json({ error: 'TMDB API key is not configured' });
  }

  // --- 3. Build the upstream URL --------------------------------------------
  const url = new URL(TMDB_URL);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('sort_by', 'popularity.desc');
  url.searchParams.set('language', language);
  url.searchParams.set('page', page);

  try {
    // --- 4. Call upstream ----------------------------------------------------
    const upstream = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
      },
    });

    // --- 5. Propagate upstream HTTP errors -----------------------------------
    if (!upstream.ok) {
      return response
        .status(upstream.status)
        .json({ error: `Upstream TMDB error: ${upstream.statusText}` });
    }

    // --- 6. Project upstream JSON down to our public schema ------------------
    const data = (await upstream.json()) as TmdbResponse;

    const shows = data.results.map((s) => ({
      id: s.id,
      title: s.original_name,
      overview: s.overview,
      poster_path: s.poster_path,
      first_air_date: s.first_air_date,
      language: s.original_language,
    }));

    return response.json({ language, page: Number(page), results: shows });
  } catch (err) {
    // --- 7. Network / parse failures -----------------------------------------
    return response
      .status(502)
      .json({ error: 'Failed to reach TMDB', detail: (err as Error).message });
  }
});

export { router as tvPopularRouter };