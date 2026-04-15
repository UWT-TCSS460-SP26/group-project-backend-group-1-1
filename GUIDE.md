# API Docs — Movies

Human-readable reference for the movie endpoints. The canonical machine-readable spec lives in [openapi.yaml](openapi.yaml).

Base URL: `https://tcss460-team-1-api.onrender.com`

---

## Route summary

**6 content routes** (same pattern — search / popular / details — for both media types), plus the existing health check.

| #   | Method | Path              | Purpose             |
| --- | ------ | ----------------- | ------------------- |
| 1   | GET    | `/movies/search`  | Search movies       |
| 2   | GET    | `/movies/popular` | Popular movies list |
| 3   | GET    | `/movies/:id`     | Movie details       |
| 4   | GET    | `/tv/search`      | Search TV shows     |
| 5   | GET    | `/tv/popular`     | Popular TV list     |
| 6   | GET    | `/tv/:id`         | TV show details     |
| +1  | GET    | `/health`         | Health check        |

= **7 total routes.**

---

## Response shape overview

All movie responses are transformed into our own schema — no raw TMDB JSON is ever returned.

- **`MovieSummary`** — lightweight shape for list/grid views. Contains just enough to render a card (poster, title, year, rating, short synopsis).
- **`MovieDetails`** — full shape for the detail view. Everything in `MovieSummary` plus runtime, tagline, genres, production companies, budget/revenue, and collection info.
- **`PaginatedMovies`** — envelope wrapping an array of `MovieSummary` with page metadata.

This split means list endpoints stay fast and small, and the heavier detail payload is only fetched once a user commits to a title.

---

## Endpoints

### `GET /movies/search`

Search movies by title. Returns a paginated list of `MovieSummary` objects.

Query parameters:

| Name   | Type    | Required | Default | Description                       |
| ------ | ------- | -------- | ------- | --------------------------------- |
| `q`    | string  | yes      | —       | Search query (title or keywords). |
| `page` | integer | no       | `1`     | 1-based page number.              |

Example request:

```http
GET /movies/search?q=fight+club&page=1
```

Responses:

- `200 OK` — [`PaginatedMovies`](#paginatedmovies)
- `400 Bad Request` — missing or invalid `q`

---

### `GET /movies/popular`

Returns the current list of popular movies as `MovieSummary` objects. Intended for grid/list views and featured carousels.

Query parameters:

| Name   | Type    | Required | Default | Description          |
| ------ | ------- | -------- | ------- | -------------------- |
| `page` | integer | no       | `1`     | 1-based page number. |

Example request:

```http
GET /movies/popular?page=1
```

Responses:

- `200 OK` — [`PaginatedMovies`](#paginatedmovies)

---

### `GET /movies/:id`

Full detail view for a single movie.

Path parameters:

| Name | Type    | Required | Description       |
| ---- | ------- | -------- | ----------------- |
| `id` | integer | yes      | Movie identifier. |

Example request:

```http
GET /movies/550
```

Responses:

- `200 OK` — [`MovieDetails`](#moviedetails)
- `404 Not Found` — movie with that id does not exist

---

## Schemas

### Shared building blocks

**`Image`** — pre-built poster/backdrop URLs in three sizes.

```json
{
  "small": "https://image.tmdb.org/t/p/w342/abc.jpg",
  "medium": "https://image.tmdb.org/t/p/w500/abc.jpg",
  "large": "https://image.tmdb.org/t/p/original/abc.jpg"
}
```

**`Rating`**

```json
{ "average": 8.4, "count": 26871, "scale": 10 }
```

**`Genre`** — `{ "id": 28, "name": "Action" }`
**`Language`** — `{ "code": "en", "name": "English" }`
**`Company`** — `{ "id": 420, "name": "Marvel Studios", "logo": Image|null, "country": "US" }`
**`Collection`** — `{ "id": 123, "name": "...", "poster": Image|null }` or `null`

---

### `MovieSummary`

Lightweight shape used in list/grid responses.

```json
{
  "id": 550,
  "title": "Fight Club",
  "originalTitle": "Fight Club",
  "synopsis": "A ticking-time-bomb insomniac and a slippery soap salesman...",
  "releaseDate": "1999-10-15",
  "releaseYear": 1999,
  "poster": { "small": "...", "medium": "...", "large": "..." },
  "backdrop": { "small": "...", "medium": "...", "large": "..." },
  "rating": { "average": 8.4, "count": 26871, "scale": 10 },
  "popularity": 61.4,
  "originalLanguage": "en",
  "genreIds": [18, 53],
  "adult": false
}
```

---

### `MovieDetails`

Extends `MovieSummary` with the fields below. Returned only by `GET /movies/:id`.

```json
{
  "tagline": "Mischief. Mayhem. Soap.",
  "runtimeMinutes": 139,
  "status": "Released",
  "homepage": "https://...",
  "imdbId": "tt0137523",
  "genres": [{ "id": 18, "name": "Drama" }],
  "spokenLanguages": [{ "code": "en", "name": "English" }],
  "productionCompanies": [
    { "id": 508, "name": "Regency Enterprises", "logo": null, "country": "US" }
  ],
  "productionCountries": [{ "code": "US", "name": "United States" }],
  "budget": 63000000,
  "revenue": 100853753,
  "collection": null
}
```

---

### `PaginatedMovies`

Envelope returned by `/movies/search` and `/movies/popular`.

```json
{
  "page": 1,
  "totalPages": 42,
  "totalResults": 836,
  "results": [
    /* MovieSummary[] */
  ]
}
```
