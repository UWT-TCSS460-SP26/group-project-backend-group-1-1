import { Router, Request, Response } from 'express';

const router = Router();

const TMDB_URL = 'https://api.themoviedb.org/3/search/tv';

interface TmdbTV {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  original_language: string;
}

interface TmdbResponse {
  results: TmdbTV[];
}

router.get('/tv/search', async (request: Request, response: Response) => {
  const query = (request.query.query as string)?.trim();
  const language = (request.query.language as string) || 'en-US';
  const page = (request.query.page as string) || '1';

  if (!query) {
    return response.status(400).json({ error: 'Query parameter is required' });
  }

  const token = process.env['API-KEY'];
  if (!token) {
    return response.status(500).json({ error: 'TMDB API key is not configured' });
  }

  const url = new URL(TMDB_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('language', language);
  url.searchParams.set('page', page);

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

    const data = (await upstream.json()) as TmdbResponse;

    const shows = data.results.map((show) => ({
      id: show.id,
      title: show.name,
      overview: show.overview,
      poster_path: show.poster_path,
      first_air_date: show.first_air_date,
      language: show.original_language,
    }));

    return response.json({
      query,
      language,
      page: Number(page),
      results: shows,
    });
  } catch (err) {
    return response
      .status(502)
      .json({ error: 'Failed to reach TMDB', detail: (err as Error).message });
  }
});

export { router as tvSearchRouter };
