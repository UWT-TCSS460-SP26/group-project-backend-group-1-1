import { Request, Response } from 'express';

const TMDB_URL = 'https://api.themoviedb.org/3/discover/tv';

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
export const getPopularTV = async (request: Request, response: Response) => {
  const language = (request.query.language as string) || 'en-US';
  const page = (request.query.page as string) || '1';

  const token = process.env['API-KEY'];
  if (!token) {
    return response.status(500).json({ error: 'TMDB API key is not configured' });
  }

  const url = new URL(TMDB_URL);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('sort_by', 'popularity.desc');
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
    return response
      .status(502)
      .json({ error: 'Failed to reach TMDB', detail: (err as Error).message });
  }
};
