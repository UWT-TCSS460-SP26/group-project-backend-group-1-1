import { Request, Response, NextFunction } from 'express';

/**
 * Validates that a required environment variable is set.
 * Returns a middleware function that checks for the given key in process.env.
 */
export const requireEnvVar = (key: string) => {
  return (_request: Request, response: Response, next: NextFunction) => {
    if (!process.env[key]) {
      response.status(500).json({ error: `${key} is not configured` });
      return;
    }
    next();
  };
};

/**
 * Validates that 'city' is present as either a query param or route param.
 */
export const requireCity = (request: Request, response: Response, next: NextFunction) => {
  const city = request.query.city || request.params.city;
  if (!city) {
    response.status(400).json({ error: 'City is required (query param or route param)' });
    return;
  }
  next();
};

/**
 * Validates that 'city' is present as a query param.
 */
export const requireCityQuery = (request: Request, response: Response, next: NextFunction) => {
  if (!request.query.city) {
    response.status(400).json({ error: 'City query parameter is required' });
    return;
  }
  next();
};

/**
 * Validates that the 'q' query parameter is present.
 */
export const validateSearchQuery = (request: Request, response: Response, next: NextFunction) => {
  if (!request.query.q) {
    response.status(400).json({ error: 'Missing required query parameter: q' });
    return;
  }
  next();
};

/**
 * Validates that the ':id' route parameter is a positive integer.
 */
export const validateNumericId = (request: Request, response: Response, next: NextFunction) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ error: 'Parameter "id" must be a positive integer' });
    return;
  }
  next();
};

/**
 * Validates that 'name' and 'email' are present in the request body.
 */
export const validateUserBody = (request: Request, response: Response, next: NextFunction) => {
  const { name, email } = request.body;
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('name is required and must be a string');
  }
  if (!email || typeof email !== 'string') {
    errors.push('email is required and must be a string');
  }

  if (errors.length > 0) {
    response.status(400).json({ error: 'Validation failed', details: errors });
    return;
  }
  next();
};
