# Sprint 3 — Auth² + Cloud Deploy

## MVP

Public HTTPS URL, hosted Postgres with prod migrations applied, Auth² RS256/JWKS verification, audience scoped to `group-N-api`, dev-login retired, an Issue submission route, and a combined TMDB-metadata + community-ratings detail route.

## Setup (one teammate, then PR)

1. **Audience name** — `group-N-api` (replace N with your group number); document in README + `.env.example`.
2. **Install**: `npm install express-jwt jwks-rsa`
3. **Remove dev-login**: delete `src/routes/devAuth.ts`, the `app.use('/auth', devAuthRouter)` mount, `JWT_SECRET` everywhere, and `jsonwebtoken` from `package.json`. Grep for `JWT_SECRET`, `devAuth`, `dev-login`, `jsonwebtoken` — nothing should remain.
4. **Env vars**:
   - `AUTH_ISSUER=https://tcss-460-iam.onrender.com`
   - `API_AUDIENCE=group-N-api`
   - `CORS_ALLOWED_ORIGINS=http://localhost:3000`

## User Stories

### 1. JWKS verification middleware

Replace HS256 verification with `expressjwt` + `jwks-rsa`. Verify RS256 signature, audience (`API_AUDIENCE`), issuer (`AUTH_ISSUER`), expiry. Roles arrive PascalCase: `User | Moderator | Admin | SuperAdmin | Owner`. Pick exact-match vs. hierarchy gating (or both) and document the choice. Reference: `TCSS460-backend-3` middleware shape — your audience differs.

### 2. Tie users to Auth² subject + Issue model (single migration)

- Add `subjectId String @unique` on `User`. Keep integer `id`; FKs from `Rating`/`Review` stay numeric.
- Add `Issue` model (team designs fields + status enum).
- On first authed request: call `GET {AUTH_ISSUER}/v2/oauth/userinfo`, upsert local user keyed by subject. Skip on cache hit. Skip on public routes. Reference: `resolveLocalUser` in BE-3.

### 3. Test suite migration

Replace HS256 minting helper with stubbed-middleware pattern (test header → injected `request.user`). Migrate all Sprint 2 tests. Add tests for: `POST /issues` validation, combined detail route happy-path + 404, ≥1 PascalCase role gate.

### 4. Public `POST /issues`

Anyone can submit a bug report. No auth. Validate input (reject empty title/description). Team designs fields, status enum, response shape. Admin read/triage routes come Sprint 4 — only the table + submit route now.

### 5. Combined detail route (flagship)

TMDB metadata + community aggregate (avg, count) + recent reviews in one response. Team designs shape (inline vs. sibling field, public vs. authed, zero-rating handling).

### 6. Deploy

Cloud platform (Render / Railway / Fly.io) + managed Postgres. `prisma migrate deploy` against prod. Env vars set on host (issuer, audience, DATABASE_URL, CORS allowlist). CORS: env-driven allowlist, allow `Authorization` header on preflight.

### 7. Production polish

- Health endpoint at documented path (e.g., `/health`).
- Error responses: status code + structured body, never a stack trace. Log full detail server-side.
- OpenAPI: remove dev-login entry, document new routes, security scheme names Auth² as issuer + your audience.

## Deliverables Checklist

- [ ] Audience name in README + `.env.example`
- [ ] JWKS middleware in place; dev-login + `JWT_SECRET` + `jsonwebtoken` removed
- [ ] Single migration adds `subjectId` + `Issue`
- [ ] `resolveLocalUser` (or equivalent) used by handlers needing a local row
- [ ] Tests pass on stubbed-middleware pattern; coverage for `POST /issues`, combined route, ≥1 PascalCase role gate
- [ ] `POST /issues` accepts + validates + persists
- [ ] Combined detail route returns enriched data
- [ ] Public HTTPS URL backed by hosted Postgres
- [ ] `prisma migrate deploy` ran against prod
- [ ] CORS allowlist via env; preflight allows `Authorization`
- [ ] Health endpoint live at documented path
- [ ] No stack traces in error responses
- [ ] `/api-docs` reflects current state (no dev-login, security scheme names Auth²)
- [ ] All teammates have commits
- [ ] Meeting minutes updated

## Submission

All work must be merged into `main` by the due date. The instructor grades from the `main` branch of the GitHub Classroom repository.
