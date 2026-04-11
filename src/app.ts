import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import YAML from 'yaml';
import { apiReference } from '@scalar/express-api-reference';

const app = express();

// Application-level middleware
app.use(cors());
app.use(express.json());

// OpenAPI documentation
const specFile = fs.readFileSync('./openapi.yaml', 'utf8');
const spec = YAML.parse(specFile);
app.get('/openapi.json', (_request: Request, response: Response) => {
  response.json(spec);
});
app.use('/api-docs', apiReference({ spec: { url: '/openapi.json' } }));

// Routes
app.get('/hello', (_request: Request, response: Response) => {
  response.json({ message: 'Hello, TCSS 460!' });
});
app.get('/hello/harleen', (_request: Request, response: Response) => {
  response.json({ message: 'Hello, Harleen!' });
});

// MARK: Harsirmar
app.get('/hello/harsimar', (_request: Request, response: Response) => {
  response.json({ message: 'Hello Harsimar!' });
});

// MARK: Nate
app.get('/hello/nate', (_request: Request, response: Response) => {
  response.json({ message: 'Hello Nate!' });
});

// MARK: Nate
app.get('/hello/jonathan', (_request: Request, response: Response) => {
  response.json({ message: 'Hello, Jonathan!' });
});

// MARK: Health
app.get('/health', (_request: Request, response: Response) => {
  response.json({ message: 'GOOD' });
});

// 404 handler — must be after all routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Route not found' });
});

export { app };
