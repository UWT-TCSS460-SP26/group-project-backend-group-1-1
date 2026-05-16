import { Request, Response } from 'express';

const TMDB_URL = 'https://api.themoviedb.org/3/discover/movie';

interface TmdbMovie {
  id: number;
  original_title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  original_language: string;
}

interface TmdbResponse {
  results: TmdbMovie[];
}

/**
 * GET /movies/popular
 */
export const getPopularMovies = async (request: Request, response: Response) => {
  const language = (request.query.language as string) || 'en-US';
  const page = (request.query.page as string) || '1';

  const token = process.env['API-KEY'];
  if (!token) {
    return response.status(500).json({ error: 'TMDB API key is not configured' });
  }

  const url = new URL(TMDB_URL);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('include_video', 'false');
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

    const movies = data.results.map((m) => ({
      id: m.id,
      title: m.original_title,
      overview: m.overview,
      poster_path: m.poster_path,
      release_date: m.release_date,
      language: m.original_language,
    }));

    return response.json({ language, page: Number(page), results: movies });
  } catch (err) {
    return response
      .status(502)
      .json({ error: 'Failed to reach TMDB', detail: (err as Error).message });
  }
};
