import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { apiReference } from '@scalar/express-api-reference';
import dotenv from 'dotenv';
import { moviesRouter } from './routes/movies';
import { tvRouter } from './routes/tv';
import { movieDetailsRouter } from './routes/movieDetails';
import { ratingsRouter } from './routes/ratings';
import { reviewsRouter } from './routes/reviews';
import { issuesRouter } from './routes/issues';
import { usersRouter } from './routes/users';

dotenv.config();

const app = express();

// Application-level middleware
const rawAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || '';
const allowedOrigins = rawAllowedOrigins.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // If allowlist contains *, allow everything
      if (allowedOrigins.includes('*') || rawAllowedOrigins === '') {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // eslint-disable-next-line no-console
        console.error('CORS Error: Origin ' + origin + ' not in allowlist:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use('/users', usersRouter);
app.use('/details', movieDetailsRouter);

// OpenAPI documentation
function loadSpec() {
  const specFile = fs.readFileSync('./openapi.yaml', 'utf8');
  return YAML.parse(specFile);
}
app.get('/openapi.json', (_request: Request, response: Response) => {
  return response.json(loadSpec());
});
app.use('/api-docs', apiReference({ spec: { url: '/openapi.json' } }));

// Simple HTML test page for hitting endpoints from a browser
app.get('/test', (_request: Request, response: Response) => {
  response.sendFile(path.resolve('public/test.html'));
});

// User-facing frontend (static HTML served from public/app, shared assets at /static)
app.use('/static', express.static('public/app'));
app.get('/', (_request: Request, response: Response) => {
  response.sendFile(path.resolve('public/app/index.html'));
});
app.get('/search', (_request: Request, response: Response) => {
  response.sendFile(path.resolve('public/app/search.html'));
});
app.get('/title/:type/:id', (_request: Request, response: Response) => {
  response.sendFile(path.resolve('public/app/title.html'));
});
app.get('/report', (_request: Request, response: Response) => {
  response.sendFile(path.resolve('public/app/report.html'));
});
app.get('/admin/issues', (_request: Request, response: Response) => {
  response.sendFile(path.resolve('public/app/admin-issues.html'));
});

// MARK: Health
app.get('/health', (_request: Request, response: Response) => {
  response.json({ message: 'GOOD' });
});

// MARK: Routes
app.use('/movies', moviesRouter);
app.use('/tv', tvRouter);
app.use('/ratings', ratingsRouter);
app.use('/reviews', reviewsRouter);
app.use('/issues', issuesRouter);

// 404 handler — must be after all routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Route not found' });
});

export { app };
