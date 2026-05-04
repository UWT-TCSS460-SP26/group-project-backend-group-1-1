import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import YAML from 'yaml';
import { apiReference } from '@scalar/express-api-reference';
import { moviesPopularRouter } from './routes/moviesPopular';
import { tvPopularRouter } from './routes/tvPopular';
import { tvSearchRouter } from './routes/tvSearch';
import { moviesSearchRouter } from './routes/moviesSearch';
import dotenv from 'dotenv';
import { movieIDRouter } from './routes/movieID';
import { tvIDRouter } from './routes/tvID';
import { movieDetailsRouter } from './routes/movieDetails';
import { tvDetailsRouter } from './routes/tvDetails';
import { ratingsRouter } from './routes/ratings';
import { reviewsRouter } from './routes/reviews';
import { issuesRouter } from './routes/issues';
import { usersRouter } from './routes/users';

dotenv.config();

const app = express();

// Application-level middleware
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
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
  response.json(loadSpec());
});
app.use('/api-docs', apiReference({ spec: { url: '/openapi.json' } }));

// MARK: Health
app.get('/health', (_request: Request, response: Response) => {
  response.json({ message: 'GOOD' });
});

// MARK: Routes
app.use('/', moviesPopularRouter);
app.use(tvPopularRouter);
app.use(tvSearchRouter);
app.use(moviesSearchRouter);
app.use(movieIDRouter);
app.use(tvIDRouter);
app.use(movieDetailsRouter);
app.use(tvDetailsRouter);
app.use('/ratings', ratingsRouter);
app.use('/reviews', reviewsRouter);
app.use('/issues', issuesRouter);

// 404 handler — must be after all routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Route not found' });
});

export { app };
