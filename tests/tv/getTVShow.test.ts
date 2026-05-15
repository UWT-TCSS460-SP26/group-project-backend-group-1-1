import request from 'supertest';
import { app } from '../../src/app';

const TMDB_TV = {
  id: 1399,
  name: 'Game of Thrones',
  overview: 'Seven noble families fight for control of the mythical land of Westeros.',
  poster_path: '/tv-poster.jpg',
  backdrop_path: '/tv-backdrop.jpg',
  first_air_date: '2011-04-17',
  original_language: 'en',
  vote_average: 8.5,
  number_of_seasons: 8,
  number_of_episodes: 73,
  status: 'Ended',
  genres: [{ id: 1, name: 'Sci-Fi & Fantasy' }],
};

const tmdbResponse = (show = TMDB_TV) =>
  new Response(JSON.stringify(show), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  process.env['API-KEY'] = 'test-token';
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /tv/:id', () => {
  it('returns 200 with transformed TV details', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    const res = await request(app).get('/tv/1399');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 1399,
      title: 'Game of Thrones',
      overview: 'Seven noble families fight for control of the mythical land of Westeros.',
      poster_path: '/tv-poster.jpg',
      backdrop_path: '/tv-backdrop.jpg',
      first_air_date: '2011-04-17',
      language: 'en',
      rating: 8.5,
      number_of_seasons: 8,
      number_of_episodes: 73,
      status: 'Ended',
      genres: ['Sci-Fi & Fantasy'],
    });
  });

  it('returns 500 when API-KEY is missing', async () => {
    delete process.env['API-KEY'];

    const res = await request(app).get('/tv/1399');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/not configured/i);
  });

  it('forwards upstream errors', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));

    const res = await request(app).get('/tv/1399');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Upstream TMDB error/);
  });

  it('returns 502 when fetch fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network fail'));

    const res = await request(app).get('/tv/1399');

    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/Failed to reach TMDB/);
  });
});
