import request from 'supertest';
import { app } from '../src/app';

const TMDB_MOVIE = {
  id: 550,
  title: 'Fight Club',
  overview: 'Some overview...',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  release_date: '1999-10-15',
  original_language: 'en',
  vote_average: 8.4,
  runtime: 139,
  genres: [{ id: 1, name: 'Drama' }],
};

const tmdbResponse = (movie = TMDB_MOVIE) =>
  new Response(JSON.stringify(movie), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  process.env['API-KEY'] = 'test-token';
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /movies/:id', () => {
  it('returns 200 with transformed movie details', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    const res = await request(app).get('/movies/550');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 550,
      title: 'Fight Club',
      overview: 'Some overview...',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      release_date: '1999-10-15',
      language: 'en',
      rating: 8.4,
      runtime: 139,
      genres: ['Drama'],
    });
  });

  it('returns 500 when API-KEY is missing', async () => {
    delete process.env['API-KEY'];

    const res = await request(app).get('/movies/550');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/not configured/i);
  });

  it('forwards upstream errors', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));

    const res = await request(app).get('/movies/550');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Upstream TMDB error/);
  });

  it('returns 502 when fetch fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network fail'));

    const res = await request(app).get('/movies/550');

    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/Failed to reach TMDB/);
  });
});
