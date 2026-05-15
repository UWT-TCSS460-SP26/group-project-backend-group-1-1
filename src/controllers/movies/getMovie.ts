import { Request, Response } from 'express';

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
 * GET /movies/:id
 */
export const getMovie = async (request: Request, response: Response) => {
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
    return response
      .status(502)
      .json({ error: 'Failed to reach TMDB', detail: (err as Error).message });
  }
};
