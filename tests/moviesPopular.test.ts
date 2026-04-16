import request from 'supertest';
import { app } from '../src/app';

const TMDB_MOVIE = {
  id: 640146,
  original_title: 'Ant-Man and the Wasp: Quantumania',
  overview: 'Super-Hero partners Scott Lang and Hope van Dyne...',
  poster_path: '/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg',
  release_date: '2023-02-15',
  original_language: 'en',
};

const tmdbResponse = (movies = [TMDB_MOVIE]) =>
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

describe('GET /movies/popular', () => {
  it('returns 200 with projected movie fields', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    const res = await request(app).get('/movies/popular');

    expect(res.status).toBe(200);
    expect(res.body.language).toBe('en-US');
    expect(res.body.page).toBe(1);
    expect(res.body.results).toHaveLength(1);

    const movie = res.body.results[0];
    expect(movie).toEqual({
      id: 640146,
      title: 'Ant-Man and the Wasp: Quantumania',
      overview: 'Super-Hero partners Scott Lang and Hope van Dyne...',
      poster_path: '/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg',
      release_date: '2023-02-15',
      language: 'en',
    });
  });

  it('passes language and page query params to upstream', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    const res = await request(app).get('/movies/popular?language=es-ES&page=3');

    expect(res.status).toBe(200);
    expect(res.body.language).toBe('es-ES');
    expect(res.body.page).toBe(3);

    const calledUrl = new URL(spy.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get('language')).toBe('es-ES');
    expect(calledUrl.searchParams.get('page')).toBe('3');
  });

  it('defaults language to en-US and page to 1', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    await request(app).get('/movies/popular');

    const calledUrl = new URL(spy.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get('language')).toBe('en-US');
    expect(calledUrl.searchParams.get('page')).toBe('1');
  });

  it('returns 500 when API-KEY is missing', async () => {
    delete process.env['API-KEY'];

    const res = await request(app).get('/movies/popular');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/not configured/i);
  });

  it('forwards upstream error status codes', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));

    const res = await request(app).get('/movies/popular');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Upstream TMDB error/);
  });

  it('returns 502 when fetch throws a network error', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network timeout'));

    const res = await request(app).get('/movies/popular');

    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/Failed to reach TMDB/);
    expect(res.body.detail).toBe('network timeout');
  });
});
