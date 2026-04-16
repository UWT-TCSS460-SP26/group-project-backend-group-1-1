/**
 * TMDB "Popular Movies" Proxy Route
 * ===========================================================================
 * This file is a reference implementation for a proxy route against the
 * TMDB (themoviedb.org) web API. Use it as a template when adding new proxy
 * routes (e.g. moviesSearch, tvPopular, tvID, etc.).
 *
 * ---------------------------------------------------------------------------
 * WHY A PROXY?
 * ---------------------------------------------------------------------------
 * We don't want the browser talking to TMDB directly because:
 *   1. Our upstream bearer token would leak if sent from the client.
 *   2. We want to decouple our public response schema from TMDB's — so if
 *      TMDB changes a field name, only this file changes, not the frontend.
 *   3. We can add caching, rate-limiting, and auth checks in one place.
 *
 * Each route in `src/routes/` wraps exactly one upstream TMDB endpoint and
 * projects it down to the minimum shape our clients need.
 *
 * ---------------------------------------------------------------------------
 * PATTERN — copy this 8-step structure when adding a new proxy route
 * ---------------------------------------------------------------------------
 *   1) Build an Express `Router` and define one handler per endpoint.
 *   2) Declare a TypeScript interface describing ONLY the upstream fields
 *      you actually consume. You don't need to model the whole TMDB schema.
 *   3) Read client query / path params off `request.query` / `request.params`
 *      and apply defaults.
 *   4) Pull the upstream bearer token out of `process.env` and 500 early
 *      if it is missing (fail loud during local dev).
 *   5) Build the upstream URL with `new URL(...)` + `searchParams.set(...)`
 *      so query values are encoded correctly.
 *   6) `fetch` the upstream inside a try/catch. Map non-OK upstream status
 *      codes through to the client, and map network errors to 502.
 *   7) Project the upstream JSON down to the subset your clients need,
 *      renaming fields where appropriate (e.g. original_title -> title).
 *   8) Export the router and mount it in `src/app.ts`, then document the
 *      new path + response schema in `openapi.yaml`.
 *
 * ---------------------------------------------------------------------------
 * CHECKLIST FOR A NEW ROUTE FILE
 * ---------------------------------------------------------------------------
 *   [ ] Pick an upstream TMDB endpoint and note its query params.
 *   [ ] Decide the public path under our API (e.g. `/movies/search`).
 *   [ ] Decide which fields to expose and any rename mapping.
 *   [ ] Copy this file, rename the constants, router, and handler path.
 *   [ ] Add the router import + `app.use(...)` line to `src/app.ts`.
 *   [ ] Add the path + response schema to `openapi.yaml`.
 *   [ ] Hit the endpoint locally with `curl` and confirm the shape.
 *
 * ---------------------------------------------------------------------------
 * UPSTREAM CONTRACT (what we call)
 * ---------------------------------------------------------------------------
 *   GET https://api.themoviedb.org/3/discover/movie
 *       ?include_adult=false
 *       &include_video=false
 *       &language=en-US
 *       &page=1
 *       &sort_by=popularity.desc
 *   Authorization: Bearer <TMDB v4 access token>
 *   Accept: application/json
 *
 * ---------------------------------------------------------------------------
 * PUBLIC CONTRACT (what we expose)
 * ---------------------------------------------------------------------------
 *   GET /movies/popular?language=en-US&page=1
 *
 *   200 OK
 *   {
 *     "language": "en-US",
 *     "page": 1,
 *     "results": [
 *       {
 *         "id": 640146,
 *         "title": "Ant-Man and the Wasp: Quantumania",
 *         "overview": "Super-Hero partners ...",
 *         "poster_path": "/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg",
 *         "release_date": "2023-02-15",
 *         "language": "en"
 *       }
 *     ]
 *   }
 *
 *   500 — TMDB API key not configured in .env
 *   4xx — forwarded from TMDB (e.g. 401 invalid token, 404 not found)
 *   502 — upstream unreachable or returned a non-JSON body
 *
 * ---------------------------------------------------------------------------
 * LOCAL SMOKE TEST
 * ---------------------------------------------------------------------------
 *   npm run dev
 *   curl 'http://localhost:3000/movies/popular?language=en-US&page=1' | jq
 */

import { Router, Request, Response } from 'express';

const router = Router();

// Upstream TMDB endpoint this route proxies. Keep one constant per route file
// so it's easy to swap the URL when modeling a new proxy.
const TMDB_URL = 'https://api.themoviedb.org/3/discover/movie';

// Subset of the TMDB movie object we care about. Add fields here ONLY when
// you also expose them in the projected response below.
interface TmdbMovie {
  id: number;
  original_title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  original_language: string;
}

// TMDB list endpoints wrap their payload in `{ page, results, total_pages, total_results }`.
// We only read `results` here — extend this interface if you need more.
interface TmdbResponse {
  results: TmdbMovie[];
}

/**
 * GET /movies/popular
 *
 * Proxies TMDB's "discover / sort by popularity desc" endpoint and returns a
 * trimmed `{ language, page, results[] }` envelope.
 *
 * @queryParam language  BCP-47 tag, e.g. `en-US`, `es-ES`, `ja-JP`. Default `en-US`.
 * @queryParam page      1-based page index. Default `1`.
 *
 * @returns 200 JSON `{ language, page, results: MovieSummary[] }`
 * @returns 500 if the TMDB API key is missing from env.
 * @returns upstream 4xx codes forwarded verbatim.
 * @returns 502 on network / parse failure.
 */
router.get('/movies/popular', async (request: Request, response: Response) => {
  // --- 1. Parse & default client query params --------------------------------
  // Express types query values as `string | ParsedQs | (string|ParsedQs)[]`.
  // For simple string params we cast and supply a default.
  const language = (request.query.language as string) || 'en-US';
  const page = (request.query.page as string) || '1';

  // --- 2. Read the upstream credential from env ------------------------------
  // The env var name has a hyphen, so bracket access is required.
  // Expected value: TMDB v4 "Read Access Token" (used as a Bearer token).
  const token = process.env['API-KEY'];
  if (!token) {
    return response.status(500).json({ error: 'TMDB API key is not configured' });
  }

  // --- 3. Build the upstream URL --------------------------------------------
  // Prefer `URL` + `searchParams.set` over string concatenation: it handles
  // encoding and avoids accidental double "?" / "&".
  const url = new URL(TMDB_URL);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('include_video', 'false');
  url.searchParams.set('sort_by', 'popularity.desc');
  url.searchParams.set('language', language);
  url.searchParams.set('page', page);

  try {
    // --- 4. Call upstream ----------------------------------------------------
    // `fetch` is global in Node 22+. No need to import node-fetch.
    const upstream = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
      },
    });

    // --- 5. Propagate upstream HTTP errors -----------------------------------
    // Keep the upstream status code so clients can distinguish e.g. 401 vs 404.
    if (!upstream.ok) {
      return response
        .status(upstream.status)
        .json({ error: `Upstream TMDB error: ${upstream.statusText}` });
    }

    // --- 6. Project upstream JSON down to our public schema ------------------
    // This is the key step that makes this a *proxy* and not a passthrough:
    // we pick the fields we want and rename them for our clients.
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
    // --- 7. Network / parse failures -----------------------------------------
    // 502 Bad Gateway is the correct status when the upstream is unreachable
    // or returned something we couldn't parse.
    return response
      .status(502)
      .json({ error: 'Failed to reach TMDB', detail: (err as Error).message });
  }
});

export { router as moviesPopularRouter };