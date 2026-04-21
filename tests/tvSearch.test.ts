import request from 'supertest';
import { app } from '../src/app';

const TMDB_TV = {
  id: 1399,
  name: 'Game of Thrones',
  overview: 'Seven noble families fight for control of the lands of Westeros...',
  poster_path: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
  first_air_date: '2011-04-17',
  original_language: 'en',
};

const tmdbResponse = (shows = [TMDB_TV]) =>
  new Response(JSON.stringify({ results: shows }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  process.env['API-KEY'] = 'test-token';
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /tv/search', () => {
  it('returns 200 with projected tv search fields', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    const res = await request(app).get('/tv/search?query=thrones');

    expect(res.status).toBe(200);
    expect(res.body.query).toBe('thrones');
    expect(res.body.language).toBe('en-US');
    expect(res.body.page).toBe(1);
    expect(res.body.results).toHaveLength(1);

    const show = res.body.results[0];
    expect(show).toEqual({
      id: 1399,
      title: 'Game of Thrones',
      overview: 'Seven noble families fight for control of the lands of Westeros...',
      posterPath: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
      firstAirDate: '2011-04-17',
      year: 2011,
      originalLanguage: 'en',
    });
  });

  it('passes query, language, and page params to upstream', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(tmdbResponse());

    const res = await request(app).get('/tv/search?query=dark&language=es-ES&page=2');

    expect(res.status).toBe(200);
    expect(res.body.query).toBe('dark');
    expect(res.body.language).toBe('es-ES');
    expect(res.body.page).toBe(2);

    const calledUrl = new URL(spy.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get('query')).toBe('dark');
    expect(calledUrl.searchParams.get('language')).toBe('es-ES');
    expect(calledUrl.searchParams.get('page')).toBe('2');
  });

  it('returns 400 when query is missing', async () => {
    const res = await request(app).get('/tv/search');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/query parameter is required/i);
  });

  it('returns 500 when API-KEY is missing', async () => {
    delete process.env['API-KEY'];

    const res = await request(app).get('/tv/search?query=lost');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/not configured/i);
  });

  it('forwards upstream error status codes', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }));

    const res = await request(app).get('/tv/search?query=lost');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Upstream TMDB error/);
  });

  it('returns 502 when fetch throws a network error', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network timeout'));

    const res = await request(app).get('/tv/search?query=lost');

    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/Failed to reach TMDB/);
    expect(res.body.detail).toBe('network timeout');
  });
});
