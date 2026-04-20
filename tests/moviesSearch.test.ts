import request from 'supertest';
import { app } from '../src/app';

/**
 * TmdbMovieResponse interface
 *
 * Unlike other search/popular test files (tvSearch.test, moviesPopular.test, etc.),
 * we define an explicit interface here to support edge case testing where poster_path
 * can be null. This allows us to test how the endpoint handles optional/missing poster
 * images without resorting to `any` type. The interface accurately reflects the TMDB
 * API schema where poster_path is genuinely nullable.
 */
interface TmdbMovieResponse {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  original_language: string;
}

// Mock TMDB movie response object matching the TMDB API schema
const TMDB_MOVIE: TmdbMovieResponse = {
  id: 550,
  title: 'Fight Club',
  overview: 'An insomniac office worker and a devil-may-care soap maker...',
  poster_path: '/i8M6qh39uJVvP9w5ub-h0qMjFk5.jpg',
  release_date: '1999-10-15',
  original_language: 'en',
};

// Secondary mock for testing multiple results in paginated responses
const TMDB_MOVIE_2: TmdbMovieResponse = {
  id: 278,
  title: 'The Shawshank Redemption',
  overview: 'Two imprisoned men bond over a number of years...',
  poster_path: '/q6y0Go1tsGEsmtFryDOJo3dEmona.jpg',
  release_date: '1994-09-23',
  original_language: 'en',
};

/**
 * Helper function to create a mocked TMDB API response.
 * Wraps mock movie data in the { results: [...] } envelope expected by the endpoint.
 */
const tmdbResponse = (movies: TmdbMovieResponse[] = [TMDB_MOVIE]) =>
  new Response(JSON.stringify({ results: movies }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  process.env['API-KEY'] = 'test-token';
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /movies/search', () => {
  it('returns 200 with projected movie search fields', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    const res = await request(app).get('/movies/search?query=fight');

    expect(res.status).toBe(200);
    expect(res.body.query).toBe('fight');
    expect(res.body.language).toBe('en-US');
    expect(res.body.page).toBe(1);
    expect(res.body.results).toHaveLength(1);

    const movie = res.body.results[0];
    // Verify the response schema transformation (TMDB fields mapped to our schema)
    expect(movie).toEqual({
      id: 550,
      title: 'Fight Club',
      overview: 'An insomniac office worker and a devil-may-care soap maker...',
      poster_path: '/i8M6qh39uJVvP9w5ub-h0qMjFk5.jpg',
      release_date: '1999-10-15',
      language: 'en',
    });
  });

  // Happy path: multiple results
  it('handles multiple results in search response', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse([TMDB_MOVIE, TMDB_MOVIE_2]));

    const res = await request(app).get('/movies/search?query=prison');

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0].title).toBe('Fight Club');
    expect(res.body.results[1].title).toBe('The Shawshank Redemption');
  });

  // Happy path: parameter passing
  it('passes query, language, and page params to upstream', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    const res = await request(app).get('/movies/search?query=inception&language=fr-FR&page=3');

    expect(res.status).toBe(200);
    expect(res.body.query).toBe('inception');
    expect(res.body.language).toBe('fr-FR');
    expect(res.body.page).toBe(3);

    // Verify the upstream request uses the exact parameters
    const calledUrl = new URL(spy.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get('query')).toBe('inception');
    expect(calledUrl.searchParams.get('language')).toBe('fr-FR');
    expect(calledUrl.searchParams.get('page')).toBe('3');
  });

  // Happy path: verify include_adult filter is set
  it('includes include_adult=false in upstream request', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    await request(app).get('/movies/search?query=test');

    const calledUrl = new URL(spy.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get('include_adult')).toBe('false');
  });

  // Happy path: verify authentication header
  it('sends Bearer token in Authorization header', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    await request(app).get('/movies/search?query=test');

    const headers = spy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-token');
    expect(headers.accept).toBe('application/json');
  });

  // Happy path: input sanitization
  it('trims whitespace from query parameter', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    await request(app).get('/movies/search?query=  batman  ');

    const calledUrl = new URL(spy.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get('query')).toBe('batman');
  });

  // Sad path: missing required parameter
  it('returns 400 when query parameter is missing', async () => {
    const res = await request(app).get('/movies/search');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/query parameter is required/i);
  });

  // Sad path: empty query after trimming
  it('returns 400 when query parameter is empty after trimming', async () => {
    const res = await request(app).get('/movies/search?query=   ');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/query parameter is required/i);
  });

  // Sad path: missing API key
  it('returns 500 when API-KEY is missing', async () => {
    delete process.env['API-KEY'];

    const res = await request(app).get('/movies/search?query=matrix');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/not configured/i);
  });

  // Sad path: upstream error forwarding
  it('forwards upstream error status codes', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));

    const res = await request(app).get('/movies/search?query=blade+runner');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Upstream TMDB error/);
  });

  // Sad path: network failure
  it('returns 502 when fetch throws a network error', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network timeout'));

    const res = await request(app).get('/movies/search?query=interstellar');

    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/Failed to reach TMDB/);
    expect(res.body.detail).toBe('network timeout');
  });

  // Happy path: empty results (edge case)
  it('handles empty results array from TMDB', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse([]));

    const res = await request(app).get('/movies/search?query=nonexistentmovie12345xyz');

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });

  // Happy path: type conversion
  it('converts page parameter to number in response', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    const res = await request(app).get('/movies/search?query=test&page=5');

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(5);
    expect(typeof res.body.page).toBe('number');
  });

  // Happy path: default parameter value
  it('defaults page to 1 when not provided', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    const res = await request(app).get('/movies/search?query=test');

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
  });

  // Edge case: nullable field (this is why we define the TmdbMovieResponse interface)
  it('handles movies with null poster_path', async () => {
    const movieWithoutPoster = { ...TMDB_MOVIE, poster_path: null };
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse([movieWithoutPoster]));

    const res = await request(app).get('/movies/search?query=test');

    expect(res.status).toBe(200);
    expect(res.body.results[0].poster_path).toBeNull();
  });

  // Sad path: invalid JSON response
  it('returns 502 when upstream response is not valid JSON', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('Invalid JSON', { status: 200 }));

    const res = await request(app).get('/movies/search?query=test');

    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/Failed to reach TMDB/);
  });
});
