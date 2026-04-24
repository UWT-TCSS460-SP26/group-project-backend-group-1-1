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
import devAuthRouter from './routes/devAuth';
import { ratingsRouter } from './routes/ratings';
import { reviewsRouter } from './routes/reviews';
dotenv.config();

const app = express();

// Application-level middleware
app.use(cors());
app.use(express.json());

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
app.use('/auth', devAuthRouter);
app.use('/ratings', ratingsRouter);
app.use('/reviews', reviewsRouter);

// 404 handler — must be after all routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Route not found' });
});

export { app };
