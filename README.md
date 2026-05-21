# TCSS 460 — Group Project Backend

Express + TypeScript API for the TCSS 460 group project.

## Deployed URL

**Production API:** [https://tcss460-team-1-api.onrender.com](https://tcss460-team-1-api.onrender.com)

## Quick Start for Downstream Developers

1.  **Endpoints:** Full documentation is available at [/api-docs](https://tcss460-team-1-api.onrender.com/api-docs).
2.  **Authentication:**
    -   This API requires RS256 JWTs issued by **Auth²**.
    -   **Issuer:** `https://tcss-460-iam.onrender.com`
    -   **Audience:** `group-1-api`
    -   **Token Playground:** Use the [Auth² Token Playground](https://tcss-460-iam.onrender.com/playground) to generate test tokens. Ensure you select the correct audience.
3.  **CORS & Origins:**
    -   By default, `http://localhost:3000`, `http://localhost:5173`, and `http://localhost:4173` are allowed in development environments.
    -   To add your production origin, please provide your URL to the backend team. We can add it via the `CORS_ALLOWED_ORIGINS` environment variable (comma-separated list).

## Known Limits & Quirks

-   **TMDB Rate Limits:** We currently do not cache TMDB responses. Excessive requests may result in 429 errors from the upstream provider.
-   **Lazy User Syncing:** User profiles (username, email) are synchronized from Auth² only upon their *first* authenticated request to a protected endpoint.
-   **Public Data:** All ratings, reviews, and issues are publicly readable. Write operations require a valid JWT.

## Bug Tracker (Planned)

Report bugs at our Bug Tracker Frontend: [https://group-1-frontend.onrender.com/](https://group-1-frontend.onrender.com/)
(Active starting Sprint 5).

---

## Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server (auto-reloads on changes)
npm run dev
```

## Scripts

| Command                | Description                       |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start dev server with auto-reload |
| `npm run build`        | Compile TypeScript to `dist/`     |
| `npm start`            | Run compiled output               |
| `npm test`             | Run tests                         |
| `npm run lint`         | Run ESLint                        |
| `npm run format`       | Format code with Prettier         |
| `npm run format:check` | Check formatting                  |
