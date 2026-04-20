import { Request, Response } from 'express';

export const searchByQuery = (request: Request, response: Response) => {
  const { q, limit } = request.query;
  response.json({
    message: 'Search results',
    query: {
      q: q ?? null,
      limit: limit ?? null,
    },
  });
};

export const getUserById = (request: Request, response: Response) => {
  const { id } = request.params;
  response.json({
    message: 'User details',
    params: { id },
  });
};

export const createUser = (request: Request, response: Response) => {
  const { name, email } = request.body;
  response.status(201).json({
    message: 'User created',
    body: { name, email },
  });
};

export const echoHeaders = (request: Request, response: Response) => {
  response.json({
    message: 'Headers received',
    headers: {
      'x-request-id': request.headers['x-request-id'] ?? null,
      'x-custom-header': request.headers['x-custom-header'] ?? null,
      'content-type': request.headers['content-type'] ?? null,
    },
  });
};
