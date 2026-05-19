# TCSS 460 — Group Project Backend

Express + TypeScript API for the TCSS 460 group project.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server (auto-reloads on changes)
npm run dev
```

The server starts at [https://tcss460-team-1-api.onrender.com](https://tcss460-team-1-api.onrender.com).

API documentation is at [https://tcss460-team-1-api.onrender.com/api-docs](https://tcss460-team-1-api.onrender.com/api-docs).

## Authentication

This API verifies RS256 JWTs issued by Auth² (`AUTH_ISSUER=https://tcss-460-iam.onrender.com`)
against its public JWKS. The expected audience for this group is **`group-1-api`** — tokens
must include this in the `aud` claim or they will be rejected with 401.

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

## Deployed URL

[https://tcss460-team-1-api.onrender.com](https://tcss460-team-1-api.onrender.com)

## Bug Tracker Frontend

Report bugs here:

https://group-1-frontend.onrender.com/ 